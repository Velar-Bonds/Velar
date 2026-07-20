// WebSocket polyfill (Supabase SDK lo inicializa al construir el cliente).
import { WebSocket } from 'ws';
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}

import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as expressImport from 'express';
import type { Express } from 'express';
import { ValidationError } from 'class-validator';
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        const extractErrors = (
          errors: ValidationError[],
          parentPath = '',
        ): Record<string, string[]> => {
          const result: Record<string, string[]> = {};

          for (const err of errors) {
            const path = parentPath
              ? `${parentPath}.${err.property}`
              : err.property;

            if (err.constraints) {
              result[path] = Object.values(err.constraints);
            }

            if (err.children?.length) {
              Object.assign(result, extractErrors(err.children, path));
            }
          }

          return result;
        };

        return new BadRequestException({
          message: extractErrors(validationErrors),
          error: 'Bad Request',
        });
      },
    }),
  );
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
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  cachedApp = server;
  return server;
}
