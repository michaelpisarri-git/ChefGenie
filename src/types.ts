export interface Ingredient {
  name: string;
  amount: string;
  notes?: string | null;
}

export interface Recipe {
  title: string;
  description: string;
  mealType: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  caloriesPerServing?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Ingredient[];
  instructions: string[];
  chefTips?: string[];
}

export interface RecipeRequest {
  mealType: string;
  availableIngredients: string;
  dietaryRestrictions?: string;
  servings: number;
}
