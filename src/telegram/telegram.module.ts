import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelegramService } from './telegram.service';
import { TelegramBotManagerService } from './telegram-bot-manager.service';
import { WebhookController } from './webhook.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [WebhookController],
  providers: [TelegramService, TelegramBotManagerService],
  exports: [TelegramService, TelegramBotManagerService],
})
export class TelegramModule {}