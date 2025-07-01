import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { OpenAIService } from './openai.service';
import { YouTubeService } from './youtube.service';
import { SessionService } from './session.service';

@Module({
  providers: [RecipeService, OpenAIService, YouTubeService, SessionService],
  exports: [RecipeService, OpenAIService, YouTubeService, SessionService],
})
export class CommonModule {}