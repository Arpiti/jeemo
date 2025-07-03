import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecipeService } from './recipe.service';
import { GeminiService } from './gemini.service';
import { YouTubeService } from './youtube.service';
import { SessionService } from './session.service';

@Module({
  imports: [HttpModule],
  providers: [RecipeService, GeminiService, YouTubeService, SessionService],
  exports: [RecipeService, GeminiService, YouTubeService, SessionService],
})
export class CommonModule {}