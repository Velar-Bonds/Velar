import { Controller, Get, Header } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Controller()
export class AppController {
  @Get()
  healthCheck() { return { status: 'ok', service: 'velar-api' }; }

  /** Consola de prueba (HTML estático servido desde el mismo origen). */
  @Get('console')
  @Header('Content-Type', 'text/html; charset=utf-8')
  console(): string {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'console.html'), 'utf8');
  }
}
