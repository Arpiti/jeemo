import { Module } from '@nestjs/common';
import { WebAppController } from './web-app.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [WebAppController],
})
export class WebAppModule {}