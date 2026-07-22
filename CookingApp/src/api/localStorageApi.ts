import { emit } from '../utils/eventEmitter';
import {
  deleteLocalIngredient,
  deleteLocalRecipe,
  getLocalIngredients,
  getLocalRecipes,
  getLocalSelections,
  replaceLocalSelections,
  upsertLocalIngredient,
  upsertLocalRecipe,
} from '../storage/sqliteStorage';
import { CanonicalIngredient, Recipe, ShoppingItem } from './types';

export type { CanonicalIngredient, Ingredient, Recipe, ShoppingItem } from './types';

const DEFAULT_INGREDIENTS: CanonicalIngredient[] = [
  { id: 'ing-poulet', name: 'Poulet' },
  { id: 'ing-riz', name: 'Riz' },
  { id: 'ing-oignon', name: 'Oignon' },
  { id: 'ing-ail', name: 'Ail' },
  { id: 'ing-tomate', name: 'Tomate' },
  { id: 'ing-huile-olive', name: "Huile d'olive" },
  { id: 'ing-oeuf', name: 'Oeuf' },
  { id: 'ing-fromage', name: 'Fromage râpé' },
  { id: 'ing-pates', name: 'Pâtes' },
  { id: 'ing-mais', name: 'Maïs' },
  { id: 'ing-thon', name: 'Thon' },
  { id: 'ing-salade', name: 'Salade verte' },
];

const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 'recipe-poulet-riz',
    name: 'Poulet riz sauté',
    ingredients: [
      { id: 'ing-poulet', name: 'Poulet', quantityValue: 250, quantityUnit: 'g' },
      { id: 'ing-riz', name: 'Riz', quantityValue: 200, quantityUnit: 'g' },
      { id: 'ing-oignon', name: 'Oignon', quantityValue: 1, quantityUnit: 'portion' },
      { id: 'ing-huile-olive', name: "Huile d'olive", quantityValue: 10, quantityUnit: 'ml' },
    ],
  },
  {
    id: 'recipe-omelette-fromage',
    name: 'Omelette fromage',
    ingredients: [
      { id: 'ing-oeuf', name: 'Oeuf', quantityValue: 4, quantityUnit: 'portion' },
      { id: 'ing-fromage', name: 'Fromage râpé', quantityValue: 80, quantityUnit: 'g' },
      { id: 'ing-huile-olive', name: "Huile d'olive", quantityValue: 5, quantityUnit: 'ml' },
    ],
  },
  {
    id: 'recipe-salade-thon-mais',
    name: 'Salade thon maïs',
    ingredients: [
      { id: 'ing-thon', name: 'Thon', quantityValue: 200, quantityUnit: 'g' },
      { id: 'ing-mais', name: 'Maïs', quantityValue: 150, quantityUnit: 'g' },
      { id: 'ing-tomate', name: 'Tomate', quantityValue: 2, quantityUnit: 'portion' },
      { id: 'ing-salade', name: 'Salade verte', quantityValue: 1, quantityUnit: 'portion' },
    ],
  },
];

let localDataInitialized = false;

export async function initializeLocalData(): Promise<void> {
  if (localDataInitialized) return;

  const [recipes, ingredients] = await Promise.all([getLocalRecipes(), getLocalIngredients()]);

  if (ingredients.length === 0) {
    for (const ingredient of DEFAULT_INGREDIENTS) {
      await upsertLocalIngredient(ingredient);
    }
  }

  if (recipes.length === 0) {
    for (const recipe of DEFAULT_RECIPES) {
      await upsertLocalRecipe(recipe);
    }
    await replaceLocalSelections([DEFAULT_RECIPES[0].id]);
    emit('selections:changed');
  }

  if (ingredients.length === 0) emit('ingredients:changed');
  if (recipes.length === 0) emit('recipes:changed');

  localDataInitialized = true;
}

function buildShoppingList(recipes: Recipe[], selectedIds: string[]): ShoppingItem[] {
  const selectedSet = new Set(selectedIds);
  const selectedRecipes = recipes.filter(recipe => selectedSet.has(recipe.id));
  const map = new Map<string, { name: string; qty: number; unit: string }>();

  for (const recipe of selectedRecipes) {
    for (const ingredient of recipe.ingredients || []) {
      const key = (ingredient.name || '').trim().toLowerCase();
      if (!key) continue;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: ingredient.name,
          qty: ingredient.quantityValue || 0,
          unit: ingredient.quantityUnit || '',
        });
      } else if ((existing.unit || '') === (ingredient.quantityUnit || '')) {
        existing.qty += ingredient.quantityValue || 0;
      } else {
        existing.unit = existing.unit ? `${existing.unit} + ${ingredient.quantityUnit || ''}` : ingredient.quantityUnit || '';
      }
    }
  }

  return Array.from(map.values()).map(item => ({
    name: item.name,
    quantity: `${item.qty} ${item.unit}`.trim(),
  }));
}

function createRecipeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getRecipes(): Promise<Recipe[]> {
  return getLocalRecipes();
}

export async function createRecipe(recipe: Omit<Recipe, 'id'> | Recipe): Promise<Recipe> {
  const created = await upsertLocalRecipe({
    id: (recipe as Recipe).id || createRecipeId(),
    name: recipe.name,
    ingredients: recipe.ingredients || [],
  });
  emit('recipes:changed');
  return created;
}

export async function updateRecipe(id: string, recipe: Recipe): Promise<Recipe> {
  const updated = await upsertLocalRecipe({ ...recipe, id });
  emit('recipes:changed');
  return updated;
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteLocalRecipe(id);
  emit('recipes:changed');
  emit('selections:changed');
}

export async function getSelections(): Promise<string[]> {
  return getLocalSelections();
}

export async function updateSelections(ids: string[]): Promise<string[]> {
  const updated = await replaceLocalSelections(ids);
  emit('selections:changed');
  return updated;
}

export async function getShoppingList(): Promise<ShoppingItem[]> {
  const [recipes, selections] = await Promise.all([getLocalRecipes(), getLocalSelections()]);
  return buildShoppingList(recipes, selections);
}

export async function getIngredients(): Promise<CanonicalIngredient[]> {
  return getLocalIngredients();
}

export async function createIngredient(payload: { name: string }): Promise<CanonicalIngredient> {
  const created = await upsertLocalIngredient({
    id: createRecipeId(),
    name: payload.name,
  });
  emit('ingredients:changed');
  return created;
}

export async function updateIngredient(id: string, payload: { name: string }): Promise<CanonicalIngredient> {
  const updated = await upsertLocalIngredient({ id, name: payload.name });
  emit('ingredients:changed');
  return updated;
}

export async function deleteIngredient(id: string): Promise<void> {
  await deleteLocalIngredient(id);
  emit('ingredients:changed');
}
