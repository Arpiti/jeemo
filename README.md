# 🤖 Jeemo - Smart Meal Planning Bot

A multilingual Telegram bot that suggests personalized meal recipes based on user preferences, available ingredients, and cuisine choices. Built with NestJS, OpenAI, and powered by the Telegram Bot API.

## 🌟 Features

- **Multilingual Support**: English, Hindi, and Hinglish
- **6-Step Conversation Flow**: Language → Meal → Diet → Ingredients → Cuisine → Recipes
- **AI-Powered Recipe Generation**: Using OpenAI GPT-3.5-turbo
- **Video Integration**: YouTube recipe tutorials for each suggestion
- **Smart Ingredient Selection**: Contextual ingredient options based on meal type and diet
- **Session Management**: Redis-backed with in-memory fallback
- **Nutrition Information**: Calories, protein, carbs, and fat content
- **Multiple Cuisine Support**: Indian, Thai, Mexican, Italian, Chinese, and more

## 🏗️ Architecture

```
User ↔ Telegram Bot ↔ NestJS Application
├── Session Service (Redis)
├── OpenAI Service (Recipe Generation)
├── YouTube Service (Video Links)
└── Recipe Service (Orchestration)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (optional - uses in-memory storage as fallback)
- API Keys:
  - Telegram Bot Token
  - OpenAI API Key
  - YouTube Data API Key (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd jeemo
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Required Environment Variables**
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here  # Optional
   REDIS_URL=redis://localhost:6379          # Optional
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

### Using Docker

```bash
# Using Docker Compose (includes Redis)
docker-compose up -d

# Or build and run manually
docker build -t meal-bot .
docker run -p 3000:3000 --env-file .env meal-bot
```

## 🤖 Bot Setup

### Creating a Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token to your `.env` file
4. Start a conversation with your bot!

### API Keys Setup

**OpenAI API Key:**
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Create an account and generate an API key
3. Add to `.env` as `OPENAI_API_KEY`

**YouTube Data API Key (Optional):**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create credentials and add to `.env` as `YOUTUBE_API_KEY`

## 📱 User Experience Flow

1. **Start**: User sends `/start` to the bot
2. **Language**: Choose preferred language (English/Hindi/Hinglish)
3. **Meal Type**: Select meal (Breakfast/Lunch/Snacks/Dinner)
4. **Diet Preference**: Choose diet type (Vegetarian/Eggitarian/Non-Vegetarian)
5. **Ingredients**: Select available ingredients or add custom ones
6. **Cuisine**: Pick cuisine style or choose "Surprise Me"
7. **Recipes**: Get 3 personalized recipes with:
   - Ingredient lists
   - Step-by-step instructions
   - Nutritional information
   - YouTube tutorial links

## 🛠️ Development

### Project Structure

```
src/
├── constants/          # Static data (ingredients, languages)
├── services/          # Business logic services
│   ├── session.service.ts
│   ├── openai.service.ts
│   ├── youtube.service.ts
│   └── recipe.service.ts
├── telegram/          # Telegram bot integration
│   ├── telegram.service.ts
│   └── telegram.module.ts
├── types/             # TypeScript interfaces
└── main.ts           # Application entry point
```

### Key Services

- **SessionService**: Manages user conversation state with Redis/in-memory storage
- **GeminiService**: Generates recipes using GPT-3.5-turbo with structured prompts
- **YouTubeService**: Searches for recipe tutorial videos
- **RecipeService**: Orchestrates recipe generation and formatting
- **TelegramService**: Handles bot interactions and conversation flow

### Available Scripts

```bash
npm run start         # Start in production mode
npm run start:dev     # Start in development mode with hot reload
npm run build         # Build for production
npm run lint          # Run ESLint
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram bot token from BotFather |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for recipe generation |
| `YOUTUBE_API_KEY` | ❌ | YouTube Data API key for video links |
| `REDIS_URL` | ❌ | Redis connection URL (uses in-memory if not provided) |
| `PORT` | ❌ | HTTP server port (defaults to 3000) |
| `NODE_ENV` | ❌ | Environment mode (development/production) |

### Redis Configuration

Redis is used for session storage but is optional. If not configured, the bot will use in-memory storage:

```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis Cloud
REDIS_URL=redis://username:password@host:port
```

## 🌍 Multilingual Support

The bot supports three languages:

- **English**: Default language with full feature support
- **Hindi**: Native Hindi script with cultural food preferences
- **Hinglish**: Mix of Hindi and English popular in urban India

Language files are located in `src/constants/languages.ts` and can be easily extended.

## 🚦 Error Handling

The application includes comprehensive error handling:

- **API Failures**: Graceful fallbacks for OpenAI and YouTube API failures
- **Session Management**: Automatic session recovery and cleanup
- **Rate Limiting**: Built-in protection against API rate limits
- **Input Validation**: Sanitization of user inputs
- **Graceful Shutdown**: Proper cleanup on application termination

## 📊 Monitoring

### Health Check

The application provides a health check endpoint:

```bash
GET /health
Response: {"status": "ok", "timestamp": "2024-01-01T00:00:00.000Z"}
```

### Logging

Structured logging with different levels:
- `ERROR`: Critical errors and exceptions
- `WARN`: Warning messages and fallbacks
- `INFO`: General application flow
- `DEBUG`: Detailed debugging information

## 🎯 Production Deployment

### Using Docker

```dockerfile
# Build the image
docker build -t meal-bot .

# Run with environment file
docker run -d --name meal-bot -p 3000:3000 --env-file .env meal-bot
```

### Using Docker Compose

```bash
# Start all services (app + Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Cloud Deployment

The application is ready for deployment on:
- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **DigitalOcean**: Use Docker image
- **AWS/GCP**: Deploy container to ECS/Cloud Run

## 🧪 Testing

### Manual Testing Checklist

- [ ] Start conversation with `/start`
- [ ] Test all language options
- [ ] Complete full conversation flow
- [ ] Test ingredient selection/deselection
- [ ] Test custom ingredient input
- [ ] Verify recipe generation
- [ ] Check YouTube links (if configured)
- [ ] Test error scenarios
- [ ] Verify session persistence

### API Rate Limits

- **OpenAI**: 3 requests per minute per user
- **YouTube**: 10,000 units per day (100 searches)
- **Telegram**: 30 messages per second

## 🔒 Security

- Environment variables for all sensitive data
- Input sanitization for user messages
- Rate limiting protection
- Non-root Docker container
- HTTPS-only webhook support (production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure Docker build passes
- Test multilingual support

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Bot not responding:**
- Check `TELEGRAM_BOT_TOKEN` is correct
- Verify bot is started with `/start`
- Check application logs

**Recipe generation failing:**
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI API rate limits
- Review application logs for errors

**Redis connection issues:**
- Application falls back to in-memory storage
- Check `REDIS_URL` format
- Verify Redis server is running

**YouTube links not working:**
- YouTube integration is optional
- Check `YOUTUBE_API_KEY` configuration
- Verify API quota limits

## 📞 Support

For questions and support:
- Create an issue on GitHub
- Check the troubleshooting section
- Review application logs for errors

---

Built with ❤️ using NestJS, OpenAI, and Telegram Bot API