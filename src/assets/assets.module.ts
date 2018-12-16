import { Module, HttpModule } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetsProviders } from './assets.provider';
import { CollectionService } from './collection.service';
import { DownloaderService } from './downloader.service';

@Module({
    imports: [
        CoreModule,
        HttpModule,
    ],
    providers: [
        AssetsService,
        CollectionService,
        DownloaderService,
        ...AssetsProviders,
    ],
    exports: [
        AssetsService,
        CollectionService,
        DownloaderService,
        ...AssetsProviders,
    ],
    controllers: [
        AssetsController,
    ],
})
export class AssetsModule { }
