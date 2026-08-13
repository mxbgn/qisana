import { Module } from '@nestjs/common';
import { CptsService } from './cpts.service';
import { CptsController } from './cpts.controller';

@Module({
  controllers: [CptsController],
  providers: [CptsService],
})
export class CptsModule {}
