import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { UserSession, ConversationStep } from '../types/session.interface';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private redis: Redis | null = null;
  private inMemoryStorage = new Map<string, UserSession>();

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (redisUrl) {
        this.redis = new Redis(redisUrl);
        this.logger.log('Redis connection established');
      } else {
        this.logger.warn('Redis URL not provided, falling back to in-memory storage');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis, using in-memory storage', error);
      this.redis = null;
    }
  }

  async getSession(userId: string): Promise<UserSession> {
    try {
      if (this.redis) {
        const sessionData = await this.redis.get(`session:${userId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.timestamp = new Date(session.timestamp);
          return session;
        }
      } else {
        const session = this.inMemoryStorage.get(userId);
        if (session) {
          return session;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to get session for user ${userId}`, error);
    }

    // Return default session if not found or error occurred
    return this.createDefaultSession(userId);
  }

  async setSession(userId: string, session: UserSession): Promise<void> {
    try {
      session.timestamp = new Date();
      
      if (this.redis) {
        await this.redis.setex(
          `session:${userId}`,
          3600, // 1 hour expiry
          JSON.stringify(session)
        );
      } else {
        this.inMemoryStorage.set(userId, session);
      }
    } catch (error) {
      this.logger.error(`Failed to set session for user ${userId}`, error);
    }
  }

  async updateSession(userId: string, updates: Partial<UserSession>): Promise<UserSession> {
    const session = await this.getSession(userId);
    const updatedSession = { ...session, ...updates };
    await this.setSession(userId, updatedSession);
    return updatedSession;
  }

  async clearSession(userId: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(`session:${userId}`);
      } else {
        this.inMemoryStorage.delete(userId);
      }
    } catch (error) {
      this.logger.error(`Failed to clear session for user ${userId}`, error);
    }
  }

  private createDefaultSession(userId: string): UserSession {
    return {
      userId,
      step: ConversationStep.LANGUAGE,
      language: 'en',
      ingredients: [],
      timestamp: new Date(),
    };
  }

  async cleanupExpiredSessions(): Promise<void> {
    if (!this.redis) {
      // Clean up in-memory sessions older than 1 hour
      const now = new Date().getTime();
      const expiredUserIds: string[] = [];
      
      this.inMemoryStorage.forEach((session, userId) => {
        const sessionAge = now - session.timestamp.getTime();
        if (sessionAge > 3600000) { // 1 hour in milliseconds
          expiredUserIds.push(userId);
        }
      });
      
      expiredUserIds.forEach(userId => {
        this.inMemoryStorage.delete(userId);
      });
      
      if (expiredUserIds.length > 0) {
        this.logger.log(`Cleaned up ${expiredUserIds.length} expired sessions`);
      }
    }
  }
}