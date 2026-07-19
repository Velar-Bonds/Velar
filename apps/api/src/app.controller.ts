import { Controller, Get, Header } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApiResponse } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';

@Public()
@Controller()
export class AppController {
  @Get()
  @ApiResponse({ status: 200, description: 'Servidor en línea' })
  healthCheck() {
    return { status: 'ok', service: 'velar-api' };
  }

  /** Consola de prueba (HTML estático servido desde el mismo origen). */
  @Get('console')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @ApiResponse({ status: 200, description: 'Consola de prueba' })
  console(): string {
    return fs.readFileSync(
      path.join(process.cwd(), 'public', 'console.html'),
      'utf8',
    );
  }
}
