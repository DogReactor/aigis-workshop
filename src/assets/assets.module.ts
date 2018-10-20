import { Module, HttpModule } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetsProviders } from './assets.provider';

@Module({
    imports: [
        CoreModule,
        HttpModule,
    ],
    providers: [
        AssetsService,
        ...AssetsProviders,
    ],
    exports: [
        AssetsService,
        ...AssetsProviders,
    ],
    controllers: [AssetsController],
})
export class AssetsModule { }
