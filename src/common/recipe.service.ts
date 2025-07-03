import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { YouTubeService } from './youtube.service';
import { Recipe } from '../types/recipe.interface';
import { UserSession } from '../types/session.interface';

@Injectable()
export class RecipeService {
  private readonly logger = new Logger(RecipeService.name);

  constructor(
    private GeminiService: GeminiService,
    private youtubeService: YouTubeService,
  ) {}

  async generateRecipes(session: UserSession): Promise<Recipe[]> {
    try {
      this.logger.log(`Generating recipes for user ${session.userId}`);

      // 1. Generate recipes using OpenAI
      const recipes = await this.GeminiService.generateRecipes({
        mealType: session.mealType || 'lunch',
        dietType: session.dietType || 'vegetarian',
        ingredients: session.ingredients,
        cuisine: session.cuisine || 'surprise_me',
        language: session.language,
        customIngredient: session.customIngredient,
      });

      this.logger.log(`Generated ${recipes.length} recipes from OpenAI`);

      // 2. Enrich with YouTube links (parallel processing)
      const recipeNames = recipes.map((recipe) => recipe.name);
      const youtubeUrls =
        await this.youtubeService.searchMultipleRecipeVideos(recipeNames);

      // 3. Combine recipes with YouTube URLs
      const enrichedRecipes = recipes.map((recipe, index) => ({
        ...recipe,
        youtubeUrl: youtubeUrls[index] || undefined,
      }));

      this.logger.log(
        `Enriched ${enrichedRecipes.length} recipes with YouTube links`,
      );
      return enrichedRecipes;
    } catch (error) {
      this.logger.error('Failed to generate recipes', error);
      throw error;
    }
  }

  formatRecipeForDisplay(recipe: Recipe, language: string = 'en'): string {
    const macros = recipe.macros;
    const servingsText = recipe.servings ? ` (Serves ${recipe.servings})` : '';

    let formattedRecipe = `🍽️ *${recipe.name}*${servingsText}\n`;
    formattedRecipe += `⏱️ *Cooking Time:* ${recipe.cookingTime}\n\n`;

    formattedRecipe += `🥘 *Ingredients:*\n`;
    recipe.ingredients.forEach((ingredient, index) => {
      formattedRecipe += `   ${index + 1}. ${ingredient}\n`;
    });

    formattedRecipe += `\n👨‍🍳 *Step-by-Step Instructions:*\n`;
    recipe.steps.forEach((step, index) => {
      formattedRecipe += `   *${index + 1}.* ${step}\n\n`;
    });

    formattedRecipe += `📊 *NUTRITION INFO (per serving):*\n`;
    formattedRecipe += `🔥 *${macros.calories} Calories*\n`;
    formattedRecipe += `💪 Protein: ${macros.protein}g\n`;
    formattedRecipe += `🌾 Carbs: ${macros.carbs}g\n`;
    formattedRecipe += `🥑 Fat: ${macros.fat}g\n`;

    if (recipe.youtubeUrl) {
      formattedRecipe += `\n📺 *Watch How to Cook:* ${recipe.youtubeUrl}`;
    }

    return formattedRecipe;
  }

  formatRecipeListForDisplay(
    recipes: Recipe[],
    language: string = 'en',
  ): string {
    let formattedList = `Here are some delicious recipes for you:\n\n`;

    recipes.forEach((recipe, index) => {
      const calories = recipe.macros.calories;
      formattedList += `${index + 1}. *${recipe.name}* (${calories} cal)\n`;
    });

    formattedList += `\nTap a recipe number to see full details! 👆`;
    return formattedList;
  }

  async validateRecipe(recipe: Recipe): Promise<boolean> {
    // Basic validation
    if (!recipe.name || recipe.name.trim().length === 0) {
      return false;
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return false;
    }

    if (!recipe.steps || recipe.steps.length === 0) {
      return false;
    }

    if (!recipe.macros || recipe.macros.calories <= 0) {
      return false;
    }

    return true;
  }

  async getRecipeSuggestionsByPreference(
    mealType: string,
    dietType: string,
    cuisine: string,
    limit: number = 3,
  ): Promise<string[]> {
    // This could be enhanced with a database of popular recipes
    // For now, return some common suggestions based on preferences
    const suggestions = {
      breakfast: {
        vegetarian: ['Oats Upma', 'Vegetable Paratha', 'Masala Dosa'],
        non_vegetarian: ['Egg Bhurji', 'Chicken Sandwich', 'Egg Paratha'],
      },
      lunch: {
        vegetarian: ['Dal Rice', 'Paneer Butter Masala', 'Vegetable Biryani'],
        non_vegetarian: ['Chicken Curry', 'Fish Fry', 'Mutton Biryani'],
      },
      dinner: {
        vegetarian: ['Rajma Chawal', 'Palak Paneer', 'Vegetable Pulao'],
        non_vegetarian: ['Butter Chicken', 'Prawn Curry', 'Chicken Biryani'],
      },
    };

    const mealSuggestions =
      suggestions[mealType]?.[dietType] || suggestions.lunch.vegetarian;
    return mealSuggestions.slice(0, limit);
  }
}
