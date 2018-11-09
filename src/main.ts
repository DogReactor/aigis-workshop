import * as compression from 'compression';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  app.use(cors());
  app.useStaticAssets(join(__dirname, '..', 'public'));
  await app.listen(19810);
}
bootstrap();