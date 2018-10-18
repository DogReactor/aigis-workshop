import { Module, HttpModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandController } from './command/command.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsModule } from './assets/assets.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/translation'),
    HttpModule,
    AssetsModule,
    WorkersModule],
  controllers: [AppController,
    CommandController],
  providers: [AppService],
})
export class AppModule { }
