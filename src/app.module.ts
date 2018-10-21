import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AssetsModule } from './assets/assets.module';
import { UsersModule } from './users/users.module';
import { TokenVerifyMiddleware } from './core/tokenVerify.middleware';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    AssetsModule,
    UsersModule,
    CoreModule,
  ],

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TokenVerifyMiddleware)
      .forRoutes('/user');
    consumer
      .apply(TokenVerifyMiddleware)
      .forRoutes('/assets/request_files_info');
    consumer
      .apply(TokenVerifyMiddleware)
      .forRoutes('/assets/get_file');
    consumer
      .apply(TokenVerifyMiddleware)
      .forRoutes('/assets/submit_work');
  }
}
