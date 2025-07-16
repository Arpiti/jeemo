import { Test, TestingModule } from '@nestjs/testing';
import { YouTubeService } from './youtube.service';
import { ConfigService } from '@nestjs/config';

const mockConfigService = {
  get: jest.fn().mockReturnValue('FAKE_YOUTUBE_API_KEY'),
};

const mockHttpService = {
  get: jest.fn(),
};

// describe('YouTubeService (unit)', () => {
//   beforeEach(async () => {
//     await Test.createTestingModule({
//       providers: [
//         YouTubeService,
//         { provide: ConfigService, useValue: mockConfigService },
//         { provide: 'HttpService', useValue: mockHttpService },
//       ],
//     }).compile();
//     jest.clearAllMocks();
//   });
 
// });

// --- Integration test with real YouTube API ---
describe('YouTubeService Integration: search Recipe Videos from youtube (real API)', () => {
  let realService: YouTubeService;
  let realConfig: ConfigService;

  beforeAll(async () => {
    const { HttpModule } = await import('@nestjs/axios');
    const realModule: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [YouTubeService, ConfigService],
    }).compile();
    realService = realModule.get<YouTubeService>(YouTubeService);
    realConfig = realModule.get<ConfigService>(ConfigService);
    // Patch the configService to use the real API key
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      jest.spyOn(realConfig, 'get').mockImplementation((key: string) => {
        if (key === 'YOUTUBE_API_KEY') return apiKey;
        return undefined;
      });
    }
  });

  it('should return a valid YouTube URL for a real recipe name (searchMultipleRecipeVideos)', async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn('Skipping integration test: YOUTUBE_API_KEY not set');
      return;
    }
    const recipeNames = ['Paneer Butter Masala'];
    const results = await realService.searchMultipleRecipeVideos(recipeNames);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/);
  }, 15000);

  it('should return a valid YouTube URL for a real recipe name (searchRecipeVideo)', async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn('Skipping integration test: YOUTUBE_API_KEY not set');
      return;
    }
    const result = await realService.searchRecipeVideo('Paneer Butter Masala');
    expect(result).toBeDefined();
    expect(result).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/);
  }, 15000);
});
