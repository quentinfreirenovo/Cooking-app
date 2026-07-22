export type Ingredient = {
  id: string;
  name: string;
  quantityValue: number;
  quantityUnit: string;
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: Ingredient[];
};

export type ShoppingItem = {
  name: string;
  quantity: string;
};

export type CanonicalIngredient = {
  id: string;
  name: string;
};
