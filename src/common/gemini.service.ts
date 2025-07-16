import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Recipe, RecipeGenerationParams } from '../types/recipe.interface';

// Gemini API response interfaces
interface GeminiCandidatePart {
  text?: string;
}
interface GeminiCandidateContent {
  parts?: GeminiCandidatePart[];
}
interface GeminiCandidate {
  content?: GeminiCandidateContent;
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Generates recipes using Gemini 2.5 Flash API.
   * @param params RecipeGenerationParams
   * @returns Promise<Recipe[]>
   */
  async generateRecipes(params: RecipeGenerationParams): Promise<Recipe[]> {
    try {
      const prompt = this.buildGeminiPrompt(params);
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      const headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      };
      const body = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1.0, // Gemini best practice: 1.0 for creative tasks
          topP: 0.95,
          candidateCount: 1,
        },
      };
      const response = await this.httpService
        .post(this.GEMINI_URL, body, { headers })
        .toPromise();
      if (!response) {
        throw new Error('No response received from Gemini API');
      }
      const data: GeminiResponse = response.data as GeminiResponse;
      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      const firstCandidate = candidates[0];
      const content =
        firstCandidate &&
        firstCandidate.content &&
        Array.isArray(firstCandidate.content.parts)
          ? firstCandidate.content.parts[0]?.text
          : undefined;
      if (!content) {
        throw new Error('No content received from Gemini');
      }
      return this.parseGeminiRecipeResponse(content);
    } catch (error) {
      this.logger.error('Failed to generate recipes from Gemini', error);
      return this.getFallbackRecipes();
    }
  }

  /**
   * Builds a Gemini-optimized prompt for recipe generation.
   * Uses clear instructions, output format specification, and few-shot example.
   */
  private buildGeminiPrompt(params: RecipeGenerationParams): string {
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
    // Gemini best practice: clear, specific, step-by-step, specify output format
    return `You are a helpful meal planner assistant.

Generate exactly 3 ${params.dietType.replace('_', ' ')} ${params.mealType} recipes for ${cuisine} cuisine using these ingredients: ${ingredients}${customIngredient}.

Requirements:
- Each recipe must use at least 1 of the provided ingredients
- Include ALL necessary ingredients with exact quantities (not just user's ingredients)
- Provide detailed step-by-step instructions with timing and quantities
- Calculate accurate nutritional values per serving
- Make recipes practical for home cooking
- Ensure cuisine authenticity (don't mix incompatible ingredients with wrong cuisines)
- Include the best possible relevant search query for ya probable outube video for the same recipe

Output format:
Return ONLY a valid JSON array with this exact structure (no extra text):
[
  {
    "name": "Recipe Name",
    "search_query": "Search query/keywords for youtube video for the same recipe",
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
- Output must be valid JSON, no markdown, no extra text
- Steps must include timing and temperatures where needed
- Be specific about cooking techniques (chop, dice, sauté, simmer)
- Nutritional values should be realistic and accurate
- Ensure cuisine-ingredient compatibility
- If you cannot generate 3 recipes, return as many as possible in the same format.`;
  }

  /**
   * Parses Gemini's response, extracting and validating the JSON array of recipes.
   * Returns fallback recipes if parsing fails.
   */
  private parseGeminiRecipeResponse(content: string): Recipe[] {
    try {
      // Gemini may sometimes wrap JSON in code blocks or add extra text, so extract JSON array
      const jsonMatch = content.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('No JSON array found in Gemini response');
      }
      const recipesRaw = JSON.parse(jsonMatch[0]) as unknown[];
      if (!Array.isArray(recipesRaw)) {
        throw new Error('Gemini response is not an array');
      }
      // Validate and clean each recipe
      return recipesRaw
        .map((recipe: unknown, index: number): Recipe => {
          if (
            typeof recipe !== 'object' ||
            recipe === null ||
            !('name' in recipe) ||
            !('ingredients' in recipe) ||
            !('steps' in recipe) ||
            !('macros' in recipe)
          ) {
            throw new Error(`Invalid recipe structure at index ${index}`);
          }
          const r = recipe as {
            name: string;
            ingredients: unknown[];
            steps: unknown[];
            macros: {
              calories: unknown;
              protein: unknown;
              carbs: unknown;
              fat: unknown;
            };
            cookingTime?: string;
            servings?: unknown;
          };
          return {
            name: String(r.name).trim(),
            ingredients: Array.isArray(r.ingredients)
              ? r.ingredients.map((i) => String(i))
              : [],
            steps: Array.isArray(r.steps) ? r.steps.map((s) => String(s)) : [],
            macros: {
              calories: Number(r.macros.calories) || 0,
              protein: Number(r.macros.protein) || 0,
              carbs: Number(r.macros.carbs) || 0,
              fat: Number(r.macros.fat) || 0,
            },
            cookingTime: r.cookingTime || '30 minutes',
            servings: Number(r.servings) || 2,
          };
        })
        .slice(0, 3); // Ensure we only return up to 3 recipes
    } catch (error) {
      this.logger.error('Failed to parse Gemini recipe response', error);
      return this.getFallbackRecipes();
    }
  }

  /**
   * Returns fallback recipes if Gemini fails.
   */
  private getFallbackRecipes(): Recipe[] {
    // Simple fallback recipes based on meal type and diet
    const fallback = {
      name: 'Simple Vegetable Rice',
      search_query: 'Simple Vegetable Rice',
      ingredients: ['rice', 'mixed vegetables', 'oil', 'spices'],
      steps: ['Cook rice', 'Sauté vegetables', 'Mix together', 'Serve hot'],
      macros: { calories: 350, protein: 8, carbs: 65, fat: 8 },
      cookingTime: '20 minutes',
      servings: 2,
    };
    return [
      { ...fallback },
      { ...fallback, name: fallback.name + ' (Variation 1)' },
      { ...fallback, name: fallback.name + ' (Variation 2)' },
    ];
  }
}
