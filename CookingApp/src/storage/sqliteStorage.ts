import { Platform } from 'react-native';
import type { CanonicalIngredient, Ingredient, Recipe } from '../api/types';

type SqlParam = string | number | null;
type StorageState = {
  recipes: Map<string, Recipe>;
  selections: Set<string>;
  ingredients: Map<string, CanonicalIngredient>;
};

const memoryState: StorageState = {
  recipes: new Map(),
  selections: new Set(),
  ingredients: new Map(),
};

const isWindows = Platform.OS === 'windows';

type SQLiteModule = typeof import('react-native-sqlite-storage');
type SQLiteDatabase = import('react-native-sqlite-storage').SQLiteDatabase;
type ResultSet = import('react-native-sqlite-storage').ResultSet;

let sqliteModule: SQLiteModule | null = null;
let sqliteReady = false;
let dbPromise: Promise<SQLiteDatabase> | null = null;
let initialized = false;

const DB_NAME = 'cooking-app.db';

function cloneRecipe(recipe: Recipe): Recipe {
  return {
    id: recipe.id,
    name: recipe.name,
    ingredients: (recipe.ingredients || []).map((ingredient: Ingredient) => ({
      id: ingredient.id || '',
      name: ingredient.name || '',
      quantityValue: Number(ingredient.quantityValue) || 0,
      quantityUnit: ingredient.quantityUnit || 'g',
    })),
  };
}

function getSqliteModule(): SQLiteModule {
  if (!sqliteModule) {
    sqliteModule = require('react-native-sqlite-storage') as SQLiteModule;
  }
  return sqliteModule;
}

async function ensureSqliteReady(): Promise<void> {
  if (isWindows || sqliteReady) return;
  const sqlite = getSqliteModule();
  sqlite.enablePromise(true);
  sqliteReady = true;
}

async function openDb(): Promise<SQLiteDatabase> {
  await ensureSqliteReady();
  if (!dbPromise) {
    const sqlite = getSqliteModule();
    dbPromise = sqlite.openDatabase({ name: DB_NAME, location: 'default' });
  }
  return dbPromise;
}

async function executeSql(statement: string, params: SqlParam[] = []): Promise<ResultSet> {
  const db = await openDb();
  const [result] = await db.executeSql(statement, params);
  return result;
}

export async function initializeSqliteStorage(): Promise<void> {
  if (isWindows || initialized) return;

  await executeSql(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      ingredients_json TEXT NOT NULL
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS selections (
      recipe_id TEXT PRIMARY KEY NOT NULL
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    )
  `);

  initialized = true;
}

function parseIngredientsJson(value: string): Ingredient[] {
  const parsed = JSON.parse(value) as Ingredient[];
  if (!Array.isArray(parsed)) return [];
  return parsed.map((ingredient: Ingredient) => ({
    id: ingredient.id || '',
    name: ingredient.name || '',
    quantityValue: Number(ingredient.quantityValue) || 0,
    quantityUnit: ingredient.quantityUnit || 'g',
  }));
}

export async function getLocalRecipes(): Promise<Recipe[]> {
  if (isWindows) {
    return Array.from(memoryState.recipes.values()).map(cloneRecipe);
  }

  await initializeSqliteStorage();
  const rs = await executeSql('SELECT id, name, ingredients_json FROM recipes ORDER BY name COLLATE NOCASE');
  const recipes: Recipe[] = [];
  for (let index = 0; index < rs.rows.length; index += 1) {
    const row = rs.rows.item(index) as { id: string; name: string; ingredients_json: string };
    recipes.push({
      id: row.id,
      name: row.name,
      ingredients: parseIngredientsJson(row.ingredients_json),
    });
  }
  return recipes;
}

export async function replaceLocalRecipes(recipes: Recipe[]): Promise<void> {
  if (isWindows) {
    memoryState.recipes.clear();
    for (const recipe of recipes) {
      const normalized = cloneRecipe(recipe);
      memoryState.recipes.set(normalized.id, normalized);
    }
    return;
  }

  await initializeSqliteStorage();
  await executeSql('DELETE FROM recipes');
  for (const recipe of recipes) {
    const normalized = cloneRecipe(recipe);
    await executeSql(
      'INSERT INTO recipes (id, name, ingredients_json) VALUES (?, ?, ?)',
      [normalized.id, normalized.name, JSON.stringify(normalized.ingredients)]
    );
  }
}

export async function upsertLocalRecipe(recipe: Recipe): Promise<Recipe> {
  const normalized = cloneRecipe(recipe);

  if (isWindows) {
    memoryState.recipes.set(normalized.id, normalized);
    return normalized;
  }

  await initializeSqliteStorage();
  await executeSql(
    `
      INSERT INTO recipes (id, name, ingredients_json)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        ingredients_json = excluded.ingredients_json
    `,
    [normalized.id, normalized.name, JSON.stringify(normalized.ingredients)]
  );
  return normalized;
}

export async function deleteLocalRecipe(recipeId: string): Promise<void> {
  if (isWindows) {
    memoryState.recipes.delete(recipeId);
    memoryState.selections.delete(recipeId);
    return;
  }

  await initializeSqliteStorage();
  await executeSql('DELETE FROM recipes WHERE id = ?', [recipeId]);
  await executeSql('DELETE FROM selections WHERE recipe_id = ?', [recipeId]);
}

export async function getLocalSelections(): Promise<string[]> {
  if (isWindows) {
    return Array.from(memoryState.selections.values());
  }

  await initializeSqliteStorage();
  const rs = await executeSql('SELECT recipe_id FROM selections');
  const ids: string[] = [];
  for (let index = 0; index < rs.rows.length; index += 1) {
    ids.push((rs.rows.item(index) as { recipe_id: string }).recipe_id);
  }
  return ids;
}

export async function replaceLocalSelections(recipeIds: string[]): Promise<string[]> {
  if (isWindows) {
    memoryState.selections = new Set(recipeIds);
    return recipeIds;
  }

  await initializeSqliteStorage();
  await executeSql('DELETE FROM selections');
  for (const recipeId of recipeIds) {
    await executeSql('INSERT INTO selections (recipe_id) VALUES (?)', [recipeId]);
  }
  return recipeIds;
}

export async function getLocalIngredients(): Promise<CanonicalIngredient[]> {
  if (isWindows) {
    return Array.from(memoryState.ingredients.values()).map(item => ({ ...item }));
  }

  await initializeSqliteStorage();
  const rs = await executeSql('SELECT id, name FROM ingredients ORDER BY name COLLATE NOCASE');
  const ingredients: CanonicalIngredient[] = [];
  for (let index = 0; index < rs.rows.length; index += 1) {
    const row = rs.rows.item(index) as CanonicalIngredient;
    ingredients.push({ id: row.id, name: row.name });
  }
  return ingredients;
}

export async function replaceLocalIngredients(ingredients: CanonicalIngredient[]): Promise<void> {
  if (isWindows) {
    memoryState.ingredients.clear();
    for (const ingredient of ingredients) {
      memoryState.ingredients.set(ingredient.id, { ...ingredient });
    }
    return;
  }

  await initializeSqliteStorage();
  await executeSql('DELETE FROM ingredients');
  for (const ingredient of ingredients) {
    await executeSql('INSERT INTO ingredients (id, name) VALUES (?, ?)', [ingredient.id, ingredient.name]);
  }
}

export async function upsertLocalIngredient(ingredient: CanonicalIngredient): Promise<CanonicalIngredient> {
  if (isWindows) {
    memoryState.ingredients.set(ingredient.id, { ...ingredient });
    return ingredient;
  }

  await initializeSqliteStorage();
  await executeSql(
    `
      INSERT INTO ingredients (id, name)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name
    `,
    [ingredient.id, ingredient.name]
  );
  return ingredient;
}

export async function deleteLocalIngredient(ingredientId: string): Promise<void> {
  if (isWindows) {
    memoryState.ingredients.delete(ingredientId);
    return;
  }

  await initializeSqliteStorage();
  await executeSql('DELETE FROM ingredients WHERE id = ?', [ingredientId]);
}
