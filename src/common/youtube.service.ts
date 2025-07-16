import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3/search';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
  }

  async searchRecipeVideo(recipeName: string): Promise<string | null> {
    if (!this.apiKey) {
      this.logger.warn('YouTube API key not configured');
      return null;
    }

    try {
      const searchQuery = `${recipeName} recipe cooking tutorial`;
      
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            part: 'snippet',
            q: searchQuery,
            type: 'video',
            maxResults: 1,
            order: 'relevance',
            videoDuration: 'medium', // 4-20 minutes
            key: this.apiKey,
          },
          timeout: 10000, // 10 second timeout
        })
      );

      const videos = response.data?.items;
      if (videos && videos.length > 0) {
        const videoId = videos[0].id.videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        this.logger.log(`Found video for "${recipeName}": ${videoUrl}`);
        return videoUrl;
      }

      this.logger.warn(`No videos found for recipe: ${recipeName}`);
      return null;
    } catch (error) {
      this.logger.warn(`YouTube search failed for "${recipeName}":`, error.message);
      return null;
    }
  }

  async searchMultipleRecipeVideos(recipeNames: string[]): Promise<(string | null)[]> {
    if (!this.apiKey) {
      this.logger.warn('YouTube API key not configured');
      return recipeNames.map(() => null);
    }

    // Process searches in parallel but with a small delay to avoid rate limits
    const promises = recipeNames.map((recipeName, index) => 
      new Promise<string | null>((resolve) => {
        setTimeout(async () => {
          const result = await this.searchRecipeVideo(recipeName);
          resolve(result);
        }, index * 100); // 100ms delay between requests
      })
    );

    try {
      return await Promise.all(promises);
    } catch (error) {
      this.logger.error('Failed to search multiple recipe videos', error);
      return recipeNames.map(() => null);
    }
  }

  async isApiKeyValid(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            part: 'snippet',
            q: 'test',
            type: 'video',
            maxResults: 1,
            key: this.apiKey,
          },
          timeout: 5000,
        })
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error('YouTube API key validation failed', error.message);
      return false;
    }
  }
}