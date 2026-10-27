import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthService } from './auth.service';
import {
  ChangeEmailDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /** Registro público: perspectiva 'usuario' o 'partido' (TSE/admin se siembran). */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiResponse({ status: 201, description: 'Cuenta registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de registro invalidos.' })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiResponse({ status: 200, description: 'Sesion iniciada y token emitido.' })
  @ApiResponse({ status: 400, description: 'Credenciales invalidas.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  /**
   * Dispara el correo de recuperación. Responde igual exista o no la cuenta.
   * Límite más bajo que el de login: es un endpoint anónimo que provoca envío
   * de correo, así que sirve tanto para enumerar cuentas como para spamear.
   */
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }

  /** Completa la recuperación con el token del enlace. */
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.tokenHash, body.password);
  }
}

/**
 * Cambio de email: va en un controller aparte porque exige sesión, y el
 * controller de `auth` es `@Public()` entero.
 */
@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(AuthGuard)
export class AuthAccountController {
  constructor(private auth: AuthService) {}

  @Post('change-email')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  changeEmail(@CurrentUser() user: any, @Body() body: ChangeEmailDto) {
    return this.auth.changeEmail(user.id, user.email, body.email);
  }
}
