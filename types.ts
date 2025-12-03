export enum MealType {
  BREAKFAST = 'Breakfast',
  BRUNCH = 'Brunch',
  LUNCH = 'Lunch',
  DINNER = 'Dinner',
  SNACK = 'Snack',
  DESSERT = 'Dessert',
  SURPRISE = 'Surprise Me'
}

export interface Ingredient {
  name: string;
  amount: string;
  notes?: string;
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
  chefTips: string[];
}

export interface SavedRecipe extends Recipe {
  id: string;
  savedAt: number;
  imageUrl?: string | null;
  rating?: number;
  notes?: string;
}

export interface RecipeRequest {
  mealType: MealType;
  availableIngredients: string;
  servings: number;
  dietaryRestrictions?: string;
}