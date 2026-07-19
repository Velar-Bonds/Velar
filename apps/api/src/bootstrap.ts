import * as fs from 'fs';
import * as path from 'path';

// WebSocket polyfill (Supabase SDK lo inicializa al construir el cliente).
import { WebSocket } from 'ws';
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as expressImport from 'express';
import type { Express } from 'express';
import { AppModule } from './app.module';

/** Express 5 en Vercel serverless exporta la factory sin `.default`; en local puede venir como default. */
const express: typeof expressImport =
  typeof expressImport === 'function'
    ? expressImport
    : ((expressImport as { default?: typeof expressImport }).default ??
      expressImport);

let cachedApp: Express | null = null;

/** Crea (o reutiliza) la app Express de NestJS. Usada por main.ts y Vercel serverless. */
export async function createNestExpressApp(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );
  app.set('trust proxy', 1);

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [process.env.WEB_URL ?? 'http://localhost:3000'];

  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VELAR API')
    .setDescription(
      'API de VELAR: tokenizacion y trazabilidad de bonos politicos sobre Stellar. ' +
        'La mayoria de endpoints requieren un Bearer token (JWT de Supabase).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    const publicDir = path.join(__dirname, '..', 'public');

    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(
      path.join(publicDir, 'openapi.json'),
      JSON.stringify(document, null, 2),
    );
    
  }

  await app.init();
  cachedApp = server;
  return server;
}
