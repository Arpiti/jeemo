import { Controller, Post, Body, Param, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { TelegramBotManagerService } from './telegram-bot-manager.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private botManagerService: TelegramBotManagerService) {}

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('token') token: string,
    @Body() update: any,
  ): Promise<void> {
    try {
      this.logger.debug(`Received webhook for token: ${token}`);
      
      const bot = this.botManagerService.getBotByToken(token);
      if (!bot) {
        this.logger.error(`Bot not found for token: ${token}`);
        return;
      }

      // Process the update through the bot
      await bot.handleUpdate(update);
    } catch (error) {
      this.logger.error(`Error processing webhook for token ${token}:`, error);
    }
  }
}