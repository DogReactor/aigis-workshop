import { Test, TestingModule } from '@nestjs/testing';
import { Workers } from './workers';

describe('Workers', () => {
  let provider: Workers;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Workers],
    }).compile();
    provider = module.get<Workers>(Workers);
  });
  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
