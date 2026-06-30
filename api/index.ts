import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createNestExpressApp } from '../apps/api/dist/bootstrap';

/** Handler serverless de Vercel para la API NestJS de VELAR. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createNestExpressApp();
  return app(req, res);
}
