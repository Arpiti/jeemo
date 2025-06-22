import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { TelegramService } from './telegram.service';
import { SessionService } from '../services/session.service';
import { RecipeService } from '../services/recipe.service';

export interface BotConfig {
  token: string;
  name: string;
  webhookUrl?: string;
}

@Injectable()
export class TelegramBotManagerService {
  private readonly logger = new Logger(TelegramBotManagerService.name);
  private bots: Map<string, { bot: Telegraf; service: TelegramService }> = new Map();

  constructor(
    private configService: ConfigService,
    private sessionService: SessionService,
    private recipeService: RecipeService,
  ) {}

  async addBot(config: BotConfig): Promise<void> {
    if (this.bots.has(config.token)) {
      this.logger.warn(`Bot with token ${config.token} already exists`);
      return;
    }

    const telegramService = new TelegramService(
      this.configService,
      this.sessionService,
      this.recipeService,
    );

    const bot = telegramService.createBotInstance(config.token);
    this.bots.set(config.token, { bot, service: telegramService });

    this.logger.log(`Added bot: ${config.name}`);
  }

  async startBot(token: string, webhookUrl?: string): Promise<void> {
    const botData = this.bots.get(token);
    if (!botData) {
      throw new Error(`Bot with token ${token} not found`);
    }

    try {
      if (webhookUrl) {
        await botData.bot.launch({
          webhook: {
            domain: webhookUrl,
            port: parseInt(this.configService.get<string>('PORT') || '3000'),
            hookPath: `/webhook/${token}`,
          },
        });
        this.logger.log(`Bot started with webhook: ${webhookUrl}/webhook/${token}`);
      } else {
        await botData.bot.launch();
        this.logger.log(`Bot started with polling`);
      }
    } catch (error) {
      this.logger.error(`Failed to start bot with token ${token}`, error);
      throw error;
    }
  }

  async stopBot(token: string): Promise<void> {
    const botData = this.bots.get(token);
    if (botData) {
      botData.bot.stop('SIGINT');
      this.bots.delete(token);
      this.logger.log(`Stopped bot with token ${token}`);
    }
  }

  async stopAllBots(): Promise<void> {
    for (const [token] of this.bots) {
      await this.stopBot(token);
    }
  }

  getBotByToken(token: string): Telegraf | undefined {
    return this.bots.get(token)?.bot;
  }

  getAllBots(): Map<string, { bot: Telegraf; service: TelegramService }> {
    return this.bots;
  }

  async startAllBots(): Promise<void> {
    const webhookBaseUrl = this.configService.get<string>('WEBHOOK_URL');
    
    for (const [token] of this.bots) {
      const webhookUrl = webhookBaseUrl ? `${webhookBaseUrl}` : undefined;
      await this.startBot(token, webhookUrl);
    }
  }
}