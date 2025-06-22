import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Recipe, RecipeGenerationParams } from '../types/recipe.interface';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateRecipes(params: RecipeGenerationParams): Promise<Recipe[]> {
    try {
      const prompt = this.buildPrompt(params);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return this.parseRecipeResponse(content);
    } catch (error) {
      this.logger.error('Failed to generate recipes from OpenAI', error);
      throw error;
    }
  }

  private buildPrompt(params: RecipeGenerationParams): string {
    const ingredients =
      params.ingredients.length > 0
        ? params.ingredients.join(', ')
        : 'any available ingredients';
    const customIngredient = params.customIngredient
      ? `, and specifically include ${params.customIngredient}`
      : '';
    const cuisine =
      params.cuisine === 'surprise_me'
        ? 'any cuisine (surprise me)'
        : params.cuisine.replace('_', ' ');

    return `Generate exactly 3 ${params.dietType.replace('_', ' ')} ${params.mealType} recipes for ${cuisine} cuisine using these ingredients: ${ingredients}${customIngredient}.

Requirements:
1. Each recipe should use at least 3 of the provided ingredients
2. Include ALL necessary ingredients with exact quantities (not just user's ingredients)
3. Provide detailed step-by-step instructions with timing and quantities
4. Calculate accurate nutritional values per serving
5. Make recipes practical for home cooking
6. Ensure cuisine authenticity - don't mix incompatible ingredients with wrong cuisines

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Recipe Name",
    "ingredients": [
      "2 cups rice",
      "1 tbsp oil",
      "1 large onion, chopped",
      "2 tomatoes, diced"
    ],
    "steps": [
      "Heat 1 tbsp oil in a pan over medium heat (2 minutes)",
      "Add chopped onions and sauté until golden brown (5-7 minutes)",
      "Add diced tomatoes and cook until soft (4-5 minutes)"
    ],
    "macros": {
      "calories": 400,
      "protein": 25,
      "carbs": 45,
      "fat": 12
    },
    "cookingTime": "25 minutes",
    "servings": 2
  }
]

Important: 
- Include complete ingredient list with quantities (cups, tbsp, grams, pieces)
- Steps must include timing (cook for X minutes) and temperatures where needed
- Be specific about cooking techniques (chop, dice, sauté, simmer)
- Nutritional values should be realistic and accurate
- Ensure cuisine-ingredient compatibility (don't suggest pasta for Indian spices)
- Do not include any text outside the JSON array`;
  }

  private parseRecipeResponse(content: string): Recipe[] {
    try {
      // Clean the content to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const jsonString = jsonMatch[0];
      const recipes = JSON.parse(jsonString);

      if (!Array.isArray(recipes)) {
        throw new Error('Response is not an array');
      }

      // Validate and clean each recipe
      return recipes
        .map((recipe, index) => {
          if (
            !recipe.name ||
            !recipe.ingredients ||
            !recipe.steps ||
            !recipe.macros
          ) {
            throw new Error(`Invalid recipe structure at index ${index}`);
          }

          return {
            name: recipe.name.trim(),
            ingredients: Array.isArray(recipe.ingredients)
              ? recipe.ingredients
              : [],
            steps: Array.isArray(recipe.steps) ? recipe.steps : [],
            macros: {
              calories: Number(recipe.macros.calories) || 0,
              protein: Number(recipe.macros.protein) || 0,
              carbs: Number(recipe.macros.carbs) || 0,
              fat: Number(recipe.macros.fat) || 0,
            },
            cookingTime: recipe.cookingTime || '30 minutes',
            servings: Number(recipe.servings) || 2,
          };
        })
        .slice(0, 3); // Ensure we only return 3 recipes
    } catch (error) {
      this.logger.error('Failed to parse recipe response', error);

      // Return fallback recipes if parsing fails
      return this.getFallbackRecipes();
    }
  }

  private getFallbackRecipes(): Recipe[] {
    // Simple fallback recipes based on meal type and diet
    const fallbackRecipes = {
      breakfast: {
        vegetarian: {
          name: 'Simple Vegetable Scramble',
          ingredients: ['eggs', 'vegetables', 'oil', 'salt', 'pepper'],
          steps: [
            'Heat oil in pan',
            'Add vegetables',
            'Scramble eggs',
            'Season and serve',
          ],
          macros: { calories: 250, protein: 12, carbs: 8, fat: 18 },
          cookingTime: '10 minutes',
        },
      },
      lunch: {
        vegetarian: {
          name: 'Quick Vegetable Rice',
          ingredients: ['rice', 'mixed vegetables', 'oil', 'spices'],
          steps: ['Cook rice', 'Sauté vegetables', 'Mix together', 'Serve hot'],
          macros: { calories: 350, protein: 8, carbs: 65, fat: 8 },
          cookingTime: '20 minutes',
        },
      },
    };

    const fallback = fallbackRecipes.lunch.vegetarian;

    return [
      { ...fallback },
      { ...fallback, name: fallback.name + ' (Variation 1)' },
      { ...fallback, name: fallback.name + ' (Variation 2)' },
    ];
  }
}
