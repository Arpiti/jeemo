/* eslint-disable @typescript-eslint/no-misused-promises */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { TelegramService } from './telegram/telegram.service';
import { TelegramBotManagerService } from './telegram/telegram-bot-manager.service';
import { getBotConfigurations } from './config/bot.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    // Enable CORS for web interface (future use)
    app.enableCors();

    const botConfigs = getBotConfigurations();
    const useWebhooks = process.env.USE_WEBHOOKS === 'true';

    if (botConfigs.length === 0) {
      throw new Error(
        'No bot tokens configured. Please set TELEGRAM_BOT_TOKEN',
      );
    }

    if (botConfigs.length === 1 && !useWebhooks) {
      // Single bot with polling (original behavior)
      const telegramService = app.get(TelegramService);
      await telegramService.startBot();
      logger.log('Started single bot with polling');
    } else {
      // Multiple bots or webhook mode
      const botManager = app.get(TelegramBotManagerService);

      // Add all configured bots
      for (const config of botConfigs) {
        await botManager.addBot(config);
      }

      // Start all bots
      if (useWebhooks) {
        await botManager.startAllBots();
        logger.log(`Started ${botConfigs.length} bot(s) with webhooks`);
      } else {
        // Start with polling for multiple bots
        for (const config of botConfigs) {
          await botManager.startBot(config.token);
        }
        logger.log(`Started ${botConfigs.length} bot(s) with polling`);
      }
    }

    // Start the HTTP server
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
    logger.log(`Webhook mode: ${useWebhooks ? 'enabled' : 'disabled'}`);
    logger.log(`Number of bots: ${botConfigs.length}`);

    // Graceful shutdown
    process.once('SIGINT', async () => {
      logger.log('Received SIGINT, shutting down gracefully...');

      if (botConfigs.length === 1 && !useWebhooks) {
        const telegramService = app.get(TelegramService);
        await telegramService.stopBot();
      } else {
        const botManager = app.get(TelegramBotManagerService);
        await botManager.stopAllBots();
      }

      await app.close();
      process.exit(0);
    });

    process.once('SIGTERM', async () => {
      logger.log('Received SIGTERM, shutting down gracefully...');

      if (botConfigs.length === 1 && !useWebhooks) {
        const telegramService = app.get(TelegramService);
        await telegramService.stopBot();
      } else {
        const botManager = app.get(TelegramBotManagerService);
        await botManager.stopAllBots();
      }

      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
