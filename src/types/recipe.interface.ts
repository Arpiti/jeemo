export interface Recipe {
  name: string;
  ingredients: string[];
  steps: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  youtubeUrl?: string;
  cookingTime: string;
  servings?: number;
}

export interface RecipeGenerationParams {
  mealType: string;
  dietType: string;
  ingredients: string[];
  cuisine: string;
  language: string;
  customIngredient?: string;
}