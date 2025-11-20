import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Backend running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
