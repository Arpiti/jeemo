import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelegramService } from './telegram.service';
import { TelegramBotManagerService } from './telegram-bot-manager.service';
import { WebhookController } from './webhook.controller';
import { SessionService } from '../services/session.service';
import { OpenAIService } from '../services/openai.service';
import { YouTubeService } from '../services/youtube.service';
import { RecipeService } from '../services/recipe.service';

@Module({
  imports: [HttpModule],
  controllers: [WebhookController],
  providers: [
    TelegramService,
    TelegramBotManagerService,
    SessionService,
    OpenAIService,
    YouTubeService,
    RecipeService,
  ],
  exports: [TelegramService, TelegramBotManagerService],
})
export class TelegramModule {}