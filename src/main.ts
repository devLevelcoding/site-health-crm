import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT ?? 3320;
  await app.listen(port);
  console.log(`site-health-crm listening on :${port}`);
}
bootstrap();
