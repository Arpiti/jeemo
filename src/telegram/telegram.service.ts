import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context, Markup } from 'telegraf';
import { SessionService } from '../common/session.service';
import { RecipeService } from '../common/recipe.service';
import {
  ConversationStep,
  MealType,
  DietType,
  CuisineType,
} from '../types/session.interface';
import { getLocalizedMessage } from '../constants/languages';
import { getIngredientsForMealAndDiet } from '../constants/ingredients';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;

  constructor(
    private configService: ConfigService,
    private sessionService: SessionService,
    private recipeService: RecipeService,
  ) {
    this.initializeBot();
  }

  private initializeBot() {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = this.createBotInstance(botToken);
  }

  createBotInstance(botToken: string): Telegraf {
    const bot = new Telegraf(botToken);
    this.setupHandlers(bot);
    return bot;
  }

  private setupHandlers(bot?: Telegraf) {
    const targetBot = bot || this.bot;
    // Start command
    targetBot.start(async (ctx) => {
      await this.handleStart(ctx);
    });

    // Text messages
    targetBot.on('text', async (ctx) => {
      await this.handleTextMessage(ctx);
    });

    // Callback queries (inline button clicks)
    targetBot.on('callback_query', async (ctx) => {
      await this.handleCallbackQuery(ctx);
    });

    // Error handling
    targetBot.catch((err, ctx) => {
      this.logger.error(`Telegram bot error for ${ctx.updateType}`, err);
      void ctx.reply(
        'Sorry, something went wrong. Please try again by sending /start',
      );
    });
  }

  async handleStart(ctx: Context) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    // Clear existing session and start fresh
    await this.sessionService.clearSession(userId);

    await this.showLanguageSelection(ctx);
  }

  async handleTextMessage(ctx: Context) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const session = await this.sessionService.getSession(userId);
    const text =
      typeof ctx.message?.['text'] === 'string' ? ctx.message['text'] : '';

    // Handle custom ingredient input
    if (
      session?.step === ConversationStep.INGREDIENTS &&
      text &&
      typeof text === 'string' &&
      !text.startsWith('/')
    ) {
      await this.handleCustomIngredient(ctx, userId, text);
      return;
    }

    // Handle direct recipe input
    if (
      session?.step === ConversationStep.RECIPES &&
      session?.choice === 'direct' &&
      text &&
      typeof text === 'string' &&
      !text.startsWith('/')
    ) {
      await this.handleDirectRecipeInput(ctx, userId, text);
      return;
    }

    // For other steps, guide user to use buttons
    const message = getLocalizedMessage('error_message', session?.language);
    await ctx.reply(message);
  }

  async handleCallbackQuery(ctx: Context) {
    const userId = ctx.from?.id?.toString();
    const callbackData =
      ctx.callbackQuery && typeof ctx.callbackQuery['data'] === 'string'
        ? ctx.callbackQuery['data']
        : undefined;
    if (!userId || !callbackData) return;

    const session = await this.sessionService.getSession(userId);

    try {
      // Answer the callback query to stop loading
      await ctx.answerCbQuery();

      switch (session?.step) {
        case ConversationStep.LANGUAGE:
          await this.handleLanguageCallback(ctx, userId, callbackData);
          break;
        case ConversationStep.CHOICE:
          await this.handleChoiceCallback(ctx, userId, callbackData);
          break;
        case ConversationStep.MEAL:
          await this.handleMealCallback(ctx, userId, callbackData);
          break;
        case ConversationStep.DIET:
          await this.handleDietCallback(ctx, userId, callbackData);
          break;
        case ConversationStep.INGREDIENTS:
          await this.handleIngredientsCallback(ctx, userId, callbackData);
          break;
        case ConversationStep.CUISINE:
          await this.handleCuisineCallback(ctx, userId, callbackData);
          break;
        case ConversationStep.RECIPES:
          await this.handleRecipeCallback(ctx, userId, callbackData);
          break;
        default:
          await this.handleStart(ctx);
      }
    } catch (error) {
      this.logger.error(
        `Error handling callback query: ${callbackData}`,
        error,
      );
      await ctx.reply(getLocalizedMessage('error_message', session?.language));
    }
  }

  private async showLanguageSelection(ctx: Context) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🇺🇸 English', 'lang_en')],
      [Markup.button.callback('🇮🇳 हिंदी', 'lang_hi')],
      [Markup.button.callback('🇮🇳 Hinglish', 'lang_hinglish')],
    ]);

    await ctx.reply(getLocalizedMessage('welcome', 'en'), keyboard);
  }

  private async handleLanguageCallback(
    ctx: Context,
    userId: string,
    data: string,
  ) {
    const language = data.replace('lang_', '');

    await this.sessionService.updateSession(userId, {
      language,
      step: ConversationStep.CHOICE,
    });

    await this.showChoiceSelection(ctx, language);
  }

  private async showChoiceSelection(ctx: Context, language: string) {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          getLocalizedMessage('need_suggestions', language),
          'choice_suggestions',
        ),
      ],
      [
        Markup.button.callback(
          getLocalizedMessage('know_recipe', language),
          'choice_direct',
        ),
      ],
    ]);

    const message = getLocalizedMessage('choice_selection', language);
    await ctx.editMessageText(message, keyboard);
  }

  private async showMealSelection(ctx: Context, language: string) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🌅 Breakfast', 'meal_breakfast')],
      [Markup.button.callback('🍽 Lunch', 'meal_lunch')],
      [Markup.button.callback('🍿 Snacks', 'meal_snacks')],
      [Markup.button.callback('🌙 Dinner', 'meal_dinner')],
    ]);

    const message = getLocalizedMessage('meal_selection', language);
    await ctx.editMessageText(message, keyboard);
  }

  private async handleChoiceCallback(ctx: Context, userId: string, data: string) {
    const choice = data.replace('choice_', '') as 'suggestions' | 'direct';
    const session = await this.sessionService.updateSession(userId, {
      choice: choice === 'suggestions' ? 'suggestion' : 'direct',
    });

    if (choice === 'suggestions') {
      // Go to the normal suggestion flow
      await this.sessionService.updateSession(userId, {
        step: ConversationStep.MEAL,
      });
      await this.showMealSelection(ctx, session.language);
    } else {
      // Go to direct recipe input
      await this.sessionService.updateSession(userId, {
        step: ConversationStep.RECIPES,
      });
      await this.showDirectRecipeInput(ctx, session.language);
    }
  }

  private async handleMealCallback(ctx: Context, userId: string, data: string) {
    const mealType = data.replace('meal_', '') as MealType;
    const session = await this.sessionService.updateSession(userId, {
      mealType,
      step: ConversationStep.DIET,
    });

    await this.showDietSelection(ctx, session.language);
  }

  private async showDietSelection(ctx: Context, language: string) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🥬 Vegetarian', 'diet_vegetarian')],
      [Markup.button.callback('🥚 Eggitarian', 'diet_eggitarian')],
      [Markup.button.callback('🍗 Non Vegetarian', 'diet_non_vegetarian')],
    ]);

    const message = getLocalizedMessage('diet_selection', language);
    await ctx.editMessageText(message, keyboard);
  }

  private async handleDietCallback(ctx: Context, userId: string, data: string) {
    const dietType = data.replace('diet_', '') as DietType;
    const session = await this.sessionService.updateSession(userId, {
      dietType,
      step: ConversationStep.INGREDIENTS,
    });

    await this.showIngredientSelection(ctx, session);
  }

  private async showIngredientSelection(
    ctx: Context,
    session: Record<string, any>,
  ) {
    const mealType =
      session && typeof session.mealType === 'string'
        ? (session.mealType as MealType)
        : MealType.LUNCH;
    const dietType =
      session && typeof session.dietType === 'string'
        ? (session.dietType as DietType)
        : DietType.VEGETARIAN;
    const language =
      session && typeof session.language === 'string' ? session.language : 'en';
    const ingredientsArr = Array.isArray(session?.ingredients)
      ? session.ingredients
      : [];

    const ingredients = getIngredientsForMealAndDiet(mealType, dietType);
    const buttons: any[] = [];

    // Create ingredient buttons (3 per row)
    for (let i = 0; i < ingredients.length; i += 3) {
      const row = [
        Markup.button.callback(ingredients[i], `ingredient_${ingredients[i]}`),
      ];
      if (ingredients[i + 1]) {
        row.push(
          Markup.button.callback(
            ingredients[i + 1],
            `ingredient_${ingredients[i + 1]}`,
          ),
        );
      }
      if (ingredients[i + 2]) {
        row.push(
          Markup.button.callback(
            ingredients[i + 2],
            `ingredient_${ingredients[i + 2]}`,
          ),
        );
      }
      buttons.push(row);
    }

    // Add action buttons
    buttons.push([
      Markup.button.callback(
        getLocalizedMessage('custom_ingredient', language),
        'ingredient_custom',
      ),
    ]);
    buttons.push([
      Markup.button.callback(
        getLocalizedMessage('done', language),
        'ingredient_done',
      ),
      Markup.button.callback(
        getLocalizedMessage('skip_ingredients', language),
        'ingredient_skip',
      ),
    ]);

    const keyboard = Markup.inlineKeyboard(buttons);
    const selectedText =
      ingredientsArr.length > 0
        ? `\n\nSelected: ${ingredientsArr.join(', ')}`
        : '';

    const message =
      getLocalizedMessage('ingredient_selection', language) + selectedText;

    if (ctx.updateType === 'callback_query') {
      await ctx.editMessageText(message, keyboard);
    } else {
      await ctx.reply(message, keyboard);
    }
  }

  private async handleIngredientsCallback(
    ctx: Context,
    userId: string,
    data: string,
  ) {
    const session = await this.sessionService.getSession(userId);

    if (data === 'ingredient_done') {
      // Allow proceeding without ingredients - removed mandatory validation
      await this.sessionService.updateSession(userId, {
        step: ConversationStep.CUISINE,
      });

      await this.showCuisineSelection(ctx, session.language);
      return;
    }

    if (data === 'ingredient_skip') {
      // Skip ingredients and proceed to cuisine selection
      await this.sessionService.updateSession(userId, {
        ingredients: [],
        step: ConversationStep.CUISINE,
      });

      await this.showCuisineSelection(ctx, session.language);
      return;
    }

    if (data === 'ingredient_custom') {
      await ctx.editMessageText(
        'Please type your custom ingredient and send it as a message:',
        Markup.inlineKeyboard([
          [Markup.button.callback('Cancel', 'ingredient_cancel')],
        ]),
      );
      return;
    }

    if (data === 'ingredient_cancel') {
      await this.showIngredientSelection(ctx, session);
      return;
    }

    // Handle ingredient selection/deselection
    const ingredient = data.replace('ingredient_', '');
    const ingredients = Array.isArray(session?.ingredients)
      ? session?.ingredients
      : [];

    if (ingredients.includes(ingredient)) {
      // Remove ingredient
      const updatedIngredients = ingredients.filter((i) => i !== ingredient);
      await this.sessionService.updateSession(userId, {
        ingredients: updatedIngredients,
      });
    } else {
      // Add ingredient
      const updatedIngredients = [...ingredients, ingredient];
      await this.sessionService.updateSession(userId, {
        ingredients: updatedIngredients,
      });
    }

    const updatedSession = await this.sessionService.getSession(userId);
    await this.showIngredientSelection(ctx, updatedSession);
  }

  private async handleCustomIngredient(
    ctx: Context,
    userId: string,
    ingredient: string,
  ) {
    const session = await this.sessionService.getSession(userId);
    const ingredients = Array.isArray(session?.ingredients)
      ? [...session.ingredients, ingredient.trim()]
      : [];

    await this.sessionService.updateSession(userId, {
      ingredients,
      customIngredient: ingredient.trim(),
    });

    const updatedSession = await this.sessionService.getSession(userId);
    await this.showIngredientSelection(ctx, updatedSession);
  }

  private async handleDirectRecipeInput(
    ctx: Context,
    userId: string,
    recipeName: string,
  ) {
    const session = await this.sessionService.getSession(userId);
    
    // Update session with the direct recipe name
    await this.sessionService.updateSession(userId, {
      directMealName: recipeName.trim(),
    });

    // Generate recipe directly
    const updatedSession = await this.sessionService.getSession(userId);
    await this.generateDirectRecipe(ctx, updatedSession);
  }

  private async showDirectRecipeInput(ctx: Context, language: string) {
    const message = language === 'hi' 
      ? 'कृपया बताएं कि आप क्या बनाना चाहते हैं (जैसे: पनीर भुर्जी, राजमा चावल, आदि):'
      : language === 'hinglish'
      ? 'Please batayein ki aap kya banana chahte hain (jaise: paneer bhurji, rajma chawal, etc.):'
      : 'Please tell me what you want to cook (e.g., paneer bhurji, rajma chawal, etc.):';
    
    await ctx.reply(message);
  }

  private async showCuisineSelection(ctx: Context, language: string) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🇮🇳 North Indian', 'cuisine_north_indian')],
      [Markup.button.callback('🌶️ South Indian', 'cuisine_south_indian')],
      [Markup.button.callback('🇹🇭 Thai', 'cuisine_thai')],
      [Markup.button.callback('🇲🇽 Mexican', 'cuisine_mexican')],
      [Markup.button.callback('🇮🇹 Italian', 'cuisine_italian')],
      [Markup.button.callback('🍽️ Continental', 'cuisine_continental')],
      [Markup.button.callback('🫒 Mediterranean', 'cuisine_mediterranean')],
      [Markup.button.callback('🇨🇳 Chinese', 'cuisine_chinese')],
      [Markup.button.callback('🎲 Surprise Me', 'cuisine_surprise_me')],
    ]);

    const message = getLocalizedMessage('cuisine_selection', language);
    await ctx.editMessageText(message, keyboard);
  }

  private async handleCuisineCallback(
    ctx: Context,
    userId: string,
    data: string,
  ) {
    const cuisine = data.replace('cuisine_', '') as CuisineType;
    const session = await this.sessionService.updateSession(userId, {
      cuisine,
      step: ConversationStep.RECIPES,
    });

    await this.generateAndShowRecipes(ctx, session);
  }

  private async generateAndShowRecipes(ctx: Context, session) {
    try {
      // Show loading message
      const loadingMessage = getLocalizedMessage(
        'generating_recipes',
        session.language,
      );
      await ctx.editMessageText(loadingMessage);

      // Generate recipes
      const recipes = await this.recipeService.generateRecipes(session);

      if (recipes.length === 0) {
        await ctx.editMessageText(
          'Sorry, no recipes could be generated. Please try again.',
        );
        return;
      }

      // Show recipe list
      const recipeList = this.recipeService.formatRecipeListForDisplay(
        recipes,
        session.language,
      );

      const buttons = recipes.map((recipe, index) => [
        Markup.button.callback(
          `${index + 1}. ${recipe.name}`,
          `recipe_${index}`,
        ),
      ]);

      buttons.push([
        Markup.button.callback(
          getLocalizedMessage('try_again', session.language),
          'recipe_regenerate',
        ),
      ]);

      const keyboard = Markup.inlineKeyboard(buttons);
      await ctx.editMessageText(recipeList, keyboard);

      // Store recipes in session for later retrieval
      await this.sessionService.updateSession(session.userId, {
        recipes: JSON.stringify(recipes),
      });
    } catch (error) {
      this.logger.error('Failed to generate recipes', error);
      await ctx.editMessageText(
        getLocalizedMessage('error_message', session.language),
      );
    }
  }

  private async generateDirectRecipe(ctx: Context, session) {
    try {
      // Show loading message
      const loadingMessage = getLocalizedMessage(
        'generating_recipes',
        session.language,
      );
      await ctx.reply(loadingMessage);

      // Generate direct recipe
      const recipes = await this.recipeService.generateDirectRecipe(session);

      if (recipes.length === 0) {
        await ctx.reply(
          'Sorry, no recipes could be generated. Please try again.',
        );
        return;
      }

      // For direct recipe, show the first recipe directly with full details
      const recipe = recipes[0];
      const formattedRecipe = this.recipeService.formatRecipeForDisplay(
        recipe,
        session.language,
      );

      // Add a "Try Again" button
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            getLocalizedMessage('try_again', session.language),
            'recipe_regenerate',
          ),
        ],
      ]);

      await ctx.reply(formattedRecipe, keyboard);

      // Store recipes in session for later retrieval (in case user wants to try again)
      await this.sessionService.updateSession(session.userId, {
        recipes: JSON.stringify(recipes),
      });
    } catch (error) {
      this.logger.error('Failed to generate direct recipe', error);
      await ctx.reply(
        getLocalizedMessage('error_message', session.language),
      );
    }
  }

  private async handleRecipeCallback(
    ctx: Context,
    userId: string,
    data: string,
  ) {
    const session = await this.sessionService.getSession(userId);

    if (data === 'recipe_regenerate') {
      await this.generateAndShowRecipes(ctx, session);
      return;
    }

    if (data.startsWith('recipe_')) {
      const recipeIndex = parseInt(data.replace('recipe_', ''));
      const storedRecipes = session['recipes']
        ? JSON.parse(session['recipes'])
        : [];

      if (storedRecipes[recipeIndex]) {
        const recipe = storedRecipes[recipeIndex];
        const formattedRecipe = this.recipeService.formatRecipeForDisplay(
          recipe,
          session.language,
        );

        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback(
              getLocalizedMessage('back', session.language),
              'recipe_back',
            ),
          ],
          [
            Markup.button.callback(
              getLocalizedMessage('try_again', session.language),
              'recipe_regenerate',
            ),
          ],
        ]);

        await ctx.editMessageText(formattedRecipe, keyboard);
        return;
      }
    }

    if (data === 'recipe_back') {
      const storedRecipes = session['recipes']
        ? JSON.parse(session['recipes'])
        : [];
      if (storedRecipes.length > 0) {
        const recipeList = this.recipeService.formatRecipeListForDisplay(
          storedRecipes,
          session.language,
        );

        const buttons = storedRecipes.map((recipe, index) => [
          Markup.button.callback(
            `${index + 1}. ${recipe.name}`,
            `recipe_${index}`,
          ),
        ]);

        buttons.push([
          Markup.button.callback(
            getLocalizedMessage('try_again', session.language),
            'recipe_regenerate',
          ),
        ]);

        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.editMessageText(recipeList, keyboard);
      }
    }
  }

  getBotInstance(): Telegraf {
    return this.bot;
  }

  async startBot() {
    try {
      const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

      if (webhookUrl) {
        // Use webhook mode with ngrok
        await this.bot.launch({
          webhook: {
            domain: webhookUrl,
            port: parseInt(this.configService.get<string>('PORT') || '3000'),
          },
        });
        this.logger.log(`Telegram bot started with webhook: ${webhookUrl}`);
      } else {
        throw new BadRequestException(`No ngrok URL or server URL found`);
      }
    } catch (error) {
      this.logger.error('Failed to start Telegram bot', error);
      throw error;
    }
  }

  async stopBot() {
    await this.bot.stop('SIGINT');
    this.logger.log('Telegram bot stopped');
  }
}
