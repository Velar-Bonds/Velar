import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

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
