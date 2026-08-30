import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsString, Matches } from 'class-validator';
import { ALL_ROLES, Role } from '@velar/types';

/** Vincula la wallet self-custody (Freighter) del usuario a su perfil. */
export class UpdateWalletDto {
  @ApiProperty({
    description: 'Llave pública de Stellar (ed25519): G + 55 caracteres base32',
    example: 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
  })
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'stellar_public_key debe ser una llave pública de Stellar válida (G...)',
  })
  publicKey!: string;
}

/** Asignación de rol en lote — mismo criterio de autorización que setRole (admin only). */
export class BulkSetRoleDto {
  @ApiProperty({ type: [String], description: 'IDs de perfiles a actualizar' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds!: string[];

  @ApiProperty({ enum: ALL_ROLES })
  @IsIn(ALL_ROLES)
  role!: Role;
}
