import { Controller, Get } from '@nestjs/common';
import { CptsService } from './cpts.service';

@Controller('cpts')
export class CptsController {
  constructor(private readonly cptsService: CptsService) {}

  @Get()
  findAll() {
    return this.cptsService.findAll();
  }

  @Get('grouped')
  findGrouped() {
    return this.cptsService.findGrouped();
  }
}
