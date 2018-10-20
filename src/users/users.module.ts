import { Module, Global } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CoreModule } from '../core/core.module';
import { UsersProviders } from './users.provider';

@Module({
    imports: [CoreModule],
    providers: [
        UsersService,
        ...UsersProviders,
    ],
    controllers: [UsersController],
    exports: [UsersService, ...UsersProviders],
})
export class UsersModule {

}