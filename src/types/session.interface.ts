export enum ConversationStep {
  LANGUAGE = 'language',
  CHOICE = 'choice', // New step for choosing between suggestion mode or direct recipe
  MEAL = 'meal',
  DIET = 'diet',
  INGREDIENTS = 'ingredients',
  CUISINE = 'cuisine',
  RECIPES = 'recipes',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  SNACKS = 'snacks',
  DINNER = 'dinner',
}

export enum DietType {
  VEGETARIAN = 'vegetarian',
  EGGITARIAN = 'eggitarian',
  NON_VEGETARIAN = 'non_vegetarian',
}

export enum CuisineType {
  NORTH_INDIAN = 'north_indian',
  SOUTH_INDIAN = 'south_indian',
  THAI = 'thai',
  MEXICAN = 'mexican',
  ITALIAN = 'italian',
  CONTINENTAL = 'continental',
  MEDITERRANEAN = 'mediterranean',
  CHINESE = 'chinese',
  SURPRISE_ME = 'surprise_me',
}

export interface UserSession {
  userId: string;
  step: ConversationStep;
  language: string;
  choice?: 'suggestion' | 'direct'; // New field for user's choice
  mealType?: MealType;
  dietType?: DietType;
  ingredients: string[];
  customIngredient?: string;
  cuisine?: CuisineType;
  directMealName?: string; // New field for direct recipe meal name
  timestamp: Date;
  recipes?: string; // JSON string of Recipe[]
}