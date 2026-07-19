import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@velar/types';
import { UpdateWalletDto } from './dto/users.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  getMe(@CurrentUser() user: any) { return this.users.getProfile(user.id); }

  @Patch('me')
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  updateMe(@CurrentUser() user: any, @Body() body: { full_name?: string }) {
    return this.users.updateProfile(user.id, body);
  }

  /** Vincula la wallet self-custody (Freighter) del usuario a su perfil. */
  @Patch('me/wallet')
  @ApiResponse({ status: 200, description: 'Wallet vinculada exitosamente' })
  @ApiResponse({ status: 400, description: 'Llave pública inválida' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  setMyWallet(@CurrentUser() user: any, @Body() body: UpdateWalletDto) {
    return this.users.setSelfCustodyWallet(user.id, body.publicKey);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  listAll(@CurrentUser() user: any) { return this.users.listUsers(user.profile?.role as Role); }

  @Get('recompradores')
  @ApiResponse({ status: 200, description: 'Lista de destinatarios para recompras' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  listRecipients(@CurrentUser() user: any) {
    return this.users.listRecipients(user.id, user.profile?.role as Role);
  }

  @Patch(':id/role')
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  @ApiResponse({ status: 400, description: 'Rol inválido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol autorizado para cambiar roles' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  setRole(@Param('id') id: string, @Body() body: { role: Role }, @CurrentUser() user: any) {
    return this.users.setRole(id, body.role, user.profile?.role as Role);
  }
}
