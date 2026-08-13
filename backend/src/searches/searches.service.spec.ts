import { Test, TestingModule } from '@nestjs/testing';
import { SearchesService } from './searches.service';

describe('SearchesService', () => {
  let service: SearchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchesService],
    }).compile();

    service = module.get<SearchesService>(SearchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
