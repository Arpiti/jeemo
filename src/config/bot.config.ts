export interface BotConfiguration {
  token: string;
  name: string;
  webhookUrl?: string;
}

export function getBotConfigurations(): BotConfiguration[] {
  const configs: BotConfiguration[] = [];
  
  // Primary bot
  const primaryToken = process.env.TELEGRAM_BOT_TOKEN;
  if (primaryToken) {
    configs.push({
      token: primaryToken,
      name: 'Primary Bot',
      webhookUrl: process.env.WEBHOOK_URL,
    });
  }

  // Secondary bot
  const secondaryToken = process.env.TELEGRAM_BOT_TOKEN_2;
  if (secondaryToken) {
    configs.push({
      token: secondaryToken,
      name: 'Secondary Bot',
      webhookUrl: process.env.WEBHOOK_URL_2 || process.env.WEBHOOK_URL,
    });
  }

  // Third bot
  const thirdToken = process.env.TELEGRAM_BOT_TOKEN_3;
  if (thirdToken) {
    configs.push({
      token: thirdToken,
      name: 'Third Bot',
      webhookUrl: process.env.WEBHOOK_URL_3 || process.env.WEBHOOK_URL,
    });
  }

  return configs;
}