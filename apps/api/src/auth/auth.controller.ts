import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthService, LoginInput, RegisterInput } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /** Registro público: perspectiva 'usuario' o 'partido' (TSE/admin se siembran). */
  @Post('register')
  register(@Body() body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() body: LoginInput) {
    return this.auth.login(body);
  }
}
