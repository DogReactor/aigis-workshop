import { Module, HttpModule, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CommandController } from './command/command.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsModule } from './assets/assets.module';
import { WorkersModule } from './workers/workers.module';
import { UsersModule } from 'users/users.module';
import { TokenVerifyMiddleware } from 'core/tokenVerify.middleware';
import { CoreModule } from 'core/core.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/translation'),
    HttpModule,
    AssetsModule,
    WorkersModule,
    UsersModule,
    CoreModule,
  ],
  controllers: [
    CommandController,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TokenVerifyMiddleware)
      .forRoutes('/user');
  }
}
