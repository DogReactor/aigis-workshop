import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AssetsModule } from './assets/assets.module';
import { UsersModule } from './users/users.module';
import { TokenVerifyMiddleware } from './core/tokenVerify.middleware';
import { CoreModule } from './core/core.module';
import { CommonController } from './assets/common.controller';

@Module({
  imports: [
    AssetsModule,
    UsersModule,
    CoreModule,
  ],
  controllers: [CommonController],

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TokenVerifyMiddleware)
      .forRoutes('/user', '/assets');
  }
}
