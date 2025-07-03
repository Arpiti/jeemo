# 🥘 Smart Meal Suggestion Bot MVP - Revised System Design Specification

## Background

Meal planning is a recurring pain for couples and individuals alike. This revised spec simplifies the original architecture to focus on rapid MVP delivery while maintaining NestJS as the core framework. We eliminate the complex agent architecture in favor of a streamlined approach that can ship in 7 days.

## Requirements

### Must Have
- **M1**: Suggest 3 meals based on meal type, cuisine, and ingredients
- **M2**: Each suggestion must contain steps, macros (estimates), and a YouTube link
- **M3**: Conversational Telegram interface with inline buttons
- **M4**: "Surprise Me" and "Enter Ingredient" options
- **M5**: Complete 6-step user journey (Language → Meal → Diet → Ingredients → Cuisine → Recipes)
- **M6**: Session management for conversation state
- **M7**: Basic error handling and fallbacks

### Should Have
- **S1**: Multi-language support (English + Hindi/Hinglish)
- **S2**: Rate limiting for OpenAI API calls
- **S3**: Basic analytics (completion rates, popular cuisines)
- **S4**: Input validation and sanitization

### Could Have
- **C1**: Recipe caching to reduce API calls
- **C2**: User feedback collection (thumbs up/down)
- **C3**: Meal history (avoid repetition)

## Simplified Architecture

### Tech Stack
- **Backend**: NestJS (TypeScript)
- **Bot Framework**: Telegraf.js integrated with NestJS
- **AI**: OpenAI GPT-3.5-turbo
- **Video Search**: YouTube Data API v3
- **Session Storage**: Redis (with in-memory fallback for development)
- **Deployment**: Single Docker container
- **Hosting**: Railway/Render/DigitalOcean

### Architecture Diagram
```
User ↔ Telegram Bot ↔ NestJS Application
├── Session Service (Redis)
├── OpenAI Service
├── YouTube Service
└── Recipe Generation Service
```

## Implementation Design

### Project Structure
```
meal-suggestion-bot/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── telegram/
│   │   ├── telegram.module.ts
│   │   ├── telegram.service.ts
│   │   ├── telegram.controller.ts
│   │   └── scenes/
│   │       ├── conversation.scenes.ts
│   │       └── recipe.scenes.ts
│   ├── services/
│   │   ├── openai.service.ts
│   │   ├── youtube.service.ts
│   │   ├── session.service.ts
│   │   └── recipe.service.ts
│   ├── types/
│   │   ├── session.interface.ts
│   │   ├── recipe.interface.ts
│   │   └── telegram.interface.ts
│   ├── constants/
│   │   ├── prompts.ts
│   │   ├── ingredients.ts
│   │   └── languages.ts
│   └── utils/
│       ├── validators.ts
│       └── formatters.ts
├── prompts/
│   ├── recipe-generation.txt
│   └── language-templates.json
└── docker/
    └── Dockerfile
```

## Core Data Models

### Session Interface
```typescript
interface UserSession {
  userId: string;
  step: ConversationStep;
  language: string;
  mealType?: MealType;
  dietType?: DietType;
  ingredients: string[];
  customIngredient?: string;
  cuisine?: CuisineType;
  timestamp: Date;
}

enum ConversationStep {
  LANGUAGE = 'language',
  MEAL = 'meal',
  DIET = 'diet',
  INGREDIENTS = 'ingredients',
  CUISINE = 'cuisine',
  RECIPES = 'recipes'
}
```

### Recipe Interface
```typescript
interface Recipe {
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
}
```

## Service Implementations

### Recipe Service (Core Logic)
```typescript
@Injectable()
export class RecipeService {
  async generateRecipes(session: UserSession): Promise<Recipe[]> {
    // 1. Generate recipes using OpenAI
    const recipes = await this.GeminiService.generateRecipes({
      mealType: session.mealType,
      dietType: session.dietType,
      ingredients: session.ingredients,
      cuisine: session.cuisine,
      language: session.language
    });

    // 2. Enrich with YouTube links (parallel processing)
    const enrichedRecipes = await Promise.all(
      recipes.map(async (recipe) => ({
        ...recipe,
        youtubeUrl: await this.youtubeService.searchRecipeVideo(recipe.name)
      }))
    );

    return enrichedRecipes;
  }
}
```

### OpenAI Service
```typescript
@Injectable()
export class GeminiService {
  async generateRecipes(params: RecipeGenerationParams): Promise<Recipe[]> {
    const prompt = this.buildPrompt(params);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    return this.parseRecipeResponse(response.choices[0].message.content);
  }

  private buildPrompt(params: RecipeGenerationParams): string {
    // Load from prompts/recipe-generation.txt
    // Include structured output requirements
  }
}
```

### YouTube Service
```typescript
@Injectable()
export class YouTubeService {
  async searchRecipeVideo(recipeName: string): Promise<string | null> {
    try {
      const response = await this.httpService.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            q: `${recipeName} recipe cooking`,
            type: 'video',
            maxResults: 1,
            key: this.configService.get('YOUTUBE_API_KEY')
          }
        }
      );

      const videoId = response.data.items[0]?.id?.videoId;
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
    } catch (error) {
      this.logger.warn(`YouTube search failed for ${recipeName}`);
      return null;
    }
  }
}
```

## Conversation Flow Implementation

### Telegram Service (Scene Management)
```typescript
@Injectable()
export class TelegramService {
  private bot: Telegraf;

  async handleConversation(ctx: Context) {
    const userId = ctx.from.id.toString();
    const session = await this.sessionService.getSession(userId);

    switch (session.step) {
      case ConversationStep.LANGUAGE:
        return this.handleLanguageSelection(ctx, session);
      case ConversationStep.MEAL:
        return this.handleMealSelection(ctx, session);
      case ConversationStep.DIET:
        return this.handleDietSelection(ctx, session);
      case ConversationStep.INGREDIENTS:
        return this.handleIngredientSelection(ctx, session);
      case ConversationStep.CUISINE:
        return this.handleCuisineSelection(ctx, session);
      default:
        return this.startConversation(ctx);
    }
  }

  private async handleMealSelection(ctx: Context, session: UserSession) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🌅 Breakfast', 'meal_breakfast')],
      [Markup.button.callback('🍽 Lunch', 'meal_lunch')],
      [Markup.button.callback('🍿 Snacks', 'meal_snacks')],
      [Markup.button.callback('🌙 Dinner', 'meal_dinner')]
    ]);

    await ctx.reply(
      this.getLocalizedMessage('meal_selection', session.language),
      keyboard
    );
  }
}
```

## Error Handling & Fallbacks

### Global Exception Filter
```typescript
@Catch()
export class TelegramExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.getArgByIndex(0);
    this.logger.error('Telegram bot error:', exception);
    
    // Send user-friendly error message
    ctx.reply('Sorry, something went wrong. Please try again by sending /start');
  }
}
```

### Service-Level Fallbacks
- **OpenAI Timeout**: Retry once, then show "Try again later" message
- **YouTube API Failure**: Continue without video link
- **Redis Failure**: Fall back to in-memory session storage

## API Integration Details

### OpenAI Integration
- **Model**: gpt-3.5-turbo
- **Rate Limiting**: 3 requests per minute per user
- **Prompt Engineering**: Structured output with JSON schema
- **Cost Optimization**: Cache similar requests for 1 hour

### YouTube Data API
- **Quota**: 10,000 units/day (100 searches = 100 units)
- **Fallback**: If quota exceeded, skip video links
- **Caching**: Cache video links for popular recipes

### Telegram Bot API
- **Webhook**: Use webhooks instead of polling for production
- **Rate Limiting**: Built-in Telegram limits (30 messages/second)
- **Message Types**: Support text, inline keyboards, and formatted messages

## Deployment Strategy

### Environment Configuration
```typescript
// config/configuration.ts
export default () => ({
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.WEBHOOK_URL,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
});
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## Monitoring & Analytics

### Basic Metrics to Track
- Conversation completion rate (reach recipe step)
- Most popular cuisines and meal types
- OpenAI API response times
- YouTube API success rate
- User retention (7-day repeat usage)

### Logging Strategy
- Structured logging with Winston
- Log levels: ERROR, WARN, INFO, DEBUG
- Key events: conversation steps, API calls, errors

## Security Considerations

### Input Validation
- Sanitize all user inputs before sending to OpenAI
- Validate callback data from inline keyboards
- Rate limit per user (conversation attempts)

### API Security
- Environment variables for all secrets
- API key rotation strategy
- HTTPS only for webhooks

## Testing Strategy

### Unit Tests
- Service methods (OpenAI, YouTube, Recipe generation)
- Utility functions (formatters, validators)
- Session management logic

### Integration Tests
- End-to-end conversation flows
- API integration (with mocked responses)
- Error handling scenarios

### Manual Testing Checklist
- Complete conversation flow in English
- Complete conversation flow in Hindi
- All meal types and cuisines
- Error scenarios (API failures)
- Rate limiting behavior

## Performance Considerations

### Response Time Targets
- Immediate response to user interactions (<500ms)
- Recipe generation within 10 seconds
- YouTube search within 5 seconds

### Optimization Strategies
- Parallel API calls (OpenAI + YouTube)
- Recipe caching for common combinations
- Connection pooling for Redis
- Graceful degradation for failed services

## Launch Readiness Criteria

### Technical Requirements
- [ ] All conversation flows working
- [ ] Error handling implemented
- [ ] Basic analytics tracking
- [ ] Production deployment successful
- [ ] Manual testing completed

### Business Requirements
- [ ] At least 2 languages supported
- [ ] Recipe quality validated manually
- [ ] YouTube links accuracy >80%
- [ ] Response time <10 seconds average

## Post-Launch Iterations

### Week 1-2 (Immediate)
- Monitor error rates and fix critical bugs
- Collect user feedback
- Optimize OpenAI prompts based on output quality

### Week 3-4 (Short-term)
- Add more languages based on usage
- Implement recipe caching
- Add user feedback collection

### Month 2+ (Medium-term)
- WhatsApp integration
- Web interface
- Advanced personalization features