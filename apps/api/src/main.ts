// --- WebSocket polyfill ---------------------------------------------------
// Supabase Realtime requiere un WebSocket global. Node < 22 no lo trae nativo,
// así que lo inyectamos con el paquete `ws` antes de crear cualquier cliente.
// (El backend no usa realtime, pero el SDK lo inicializa al construir el cliente.)
import { WebSocket } from 'ws';
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}
// --------------------------------------------------------------------------

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`VELAR API running on http://localhost:${port}/api`);
}
bootstrap();
