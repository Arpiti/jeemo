import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RecipeService } from '../common/recipe.service';
import {
  UserSession,
  ConversationStep,
  MealType,
  DietType,
  CuisineType,
} from '../types/session.interface';
import { Recipe } from '../types/recipe.interface';

interface MealPlanRequest {
  mealType?: string;
  dietType?: string;
  cuisine?: string;
  ingredients?: string[];
  customIngredient?: string;
  language?: string;
}

@Controller('api')
export class WebAppController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post('recipes/generate')
  async generateRecipes(@Body() request: MealPlanRequest): Promise<Recipe[]> {
    const session: UserSession = {
      userId: 'web-user',
      step: ConversationStep.RECIPES,
      mealType: (request.mealType as MealType) || MealType.LUNCH,
      dietType: (request.dietType as DietType) || DietType.VEGETARIAN,
      cuisine: (request.cuisine as CuisineType) || CuisineType.SURPRISE_ME,
      ingredients: request.ingredients || [],
      customIngredient: request.customIngredient,
      language: request.language || 'en',
      timestamp: new Date(),
    };

    return await this.recipeService.generateRecipes(session);
  }

  @Get('recipes/suggestions/:mealType/:dietType/:cuisine')
  async getRecipeSuggestions(
    @Param('mealType') mealType: string = 'lunch',
    @Param('dietType') dietType: string = 'vegetarian',
    @Param('cuisine') cuisine: string = 'indian',
  ): Promise<string[]> {
    return await this.recipeService.getRecipeSuggestionsByPreference(
      mealType,
      dietType,
      cuisine,
      3,
    );
  }

  @Get('constants/ingredients')
  getIngredients() {
    return {
      categories: [
        {
          name: 'Vegetables',
          items: [
            'Tomato',
            'Onion',
            'Garlic',
            'Ginger',
            'Potato',
            'Carrot',
            'Bell Pepper',
          ],
        },
        {
          name: 'Proteins',
          items: [
            'Chicken',
            'Fish',
            'Paneer',
            'Tofu',
            'Eggs',
            'Dal',
            'Chickpeas',
          ],
        },
        {
          name: 'Grains',
          items: ['Rice', 'Wheat', 'Quinoa', 'Oats', 'Bread'],
        },
      ],
    };
  }

  @Get('constants/options')
  getOptions() {
    return {
      mealTypes: ['breakfast', 'lunch', 'dinner', 'snack'],
      dietTypes: ['vegetarian', 'non_vegetarian', 'vegan', 'keto'],
      cuisines: ['indian', 'chinese', 'italian', 'mexican', 'surprise_me'],
    };
  }
}
