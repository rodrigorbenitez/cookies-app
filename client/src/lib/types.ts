export const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'piece', 'pinch', 'packet', 'bunch', 'to taste'] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORIES = ['baking', 'dairy', 'produce', 'spices', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];


export interface RecipeSummary {
  id: number;
  title: string;
  imagePath: string | null;
  tags: string[];
  rating: number | null;
  servings: number;
  prepTime: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: number;
  amount: number | null;
  unit: Unit;
  note: string | null;
  position: number;
  catalogId: number;
  name: string;
  category: Category;
}

export interface IngredientGroup {
  id: number;
  name: string;
  position: number;
  ingredients: Ingredient[];
}

export interface Recipe extends RecipeSummary {
  instructions: string;
  ingredientGroups: IngredientGroup[];
}

export interface RecipeInput {
  title: string;
  imagePath: string | null;
  tags: string[];
  rating: number | null;
  servings: number;
  prepTime: number | null;
  instructions: string;
  ingredientGroups: {
    name: string;
    ingredients: { amount: number | null; unit: Unit; name: string; note: string | null }[];
  }[];
}

export interface CatalogEntry {
  id: number;
  name: string;
  category: Category;
  usage: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface ShoppingItem {
  id: number;
  name: string;
  catalogId: number | null;
  category: Category;
  amount: number | null;
  unit: string | null;
  checked: boolean;
  manual: boolean;
  sources: string[];
}

export interface ShoppingList {
  items: ShoppingItem[];
  recipes: { recipeId: number; servings: number; title: string; baseServings: number; imagePath: string | null }[];
}

export type SortOrder = 'recent' | 'name' | 'rating';

export interface RecipeFilters {
  q?: string;
  tags?: string[];
  minRating?: number;
  ingredient?: string;
  sort?: SortOrder;
}
