import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { CollectionService } from './collection.service';
import { DownloaderService } from './downloader.service';

describe('Assets Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [CollectionService, DownloaderService],
    }).compile();
  });
  it('should be defined', () => {
    const controller: AssetsController = module.get<AssetsController>(AssetsController);
    expect(controller).toBeDefined();
  });

});
