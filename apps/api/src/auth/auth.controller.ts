import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, RegisterInput } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /** Registro público: perspectiva 'usuario' o 'partido' (TSE/admin se siembran). */
  @Post('register')
  register(@Body() body: RegisterInput) {
    return this.auth.register(body);
  }
}
