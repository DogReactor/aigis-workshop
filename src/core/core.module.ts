import { Module, Global } from '@nestjs/common';
import { databaseProviders } from './database.provider';
import { JsonWebTokenService } from './jwt.service';

@Module({
    providers: [JsonWebTokenService, ...databaseProviders],
    exports: [JsonWebTokenService, ...databaseProviders],
})
export class CoreModule {

}