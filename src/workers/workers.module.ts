import { Module } from '@nestjs/common';
import { Workers } from './workers';

@Module({
  providers: [Workers]
})
export class WorkersModule {}
