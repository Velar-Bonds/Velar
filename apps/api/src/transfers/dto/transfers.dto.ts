import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import type { RequestTransferInput } from '@velar/types';

export class CreateTransferDto implements RequestTransferInput {
  @ApiProperty({ description: 'UUID del token del bono' })
  @IsString()
  @IsNotEmpty()
  bondTokenId!: string;

  @ApiPropertyOptional({
    description: 'UUID del comprador (opcional; por defecto el usuario autenticado)',
  })
  @IsOptional()
  @IsString()
  toOwner?: string;

  @ApiPropertyOptional({
    description: 'Método de pago elegido por el comprador',
    enum: ['sinpe', 'transferencia', 'wallet'],
  })
  @IsOptional()
  @IsIn(['sinpe', 'transferencia', 'wallet'])
  paymentMethod?: 'sinpe' | 'transferencia' | 'wallet';

  @ApiPropertyOptional({ example: 950000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: 980000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  counterOfferAmount?: number;
}

export class CounterOfferDto {
  @ApiProperty({ example: 980000 })
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class RegisterPaymentDto {
  @ApiPropertyOptional({ description: 'Hash de la evidencia de pago' })
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiPropertyOptional({ description: 'Contenido de la evidencia (se hashea)' })
  @IsOptional()
  @IsString()
  evidenceContent?: string;
}

export class RequestReturnDto {
  @ApiPropertyOptional({ description: 'Motivo del retiro del escrow' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ReturnDecisionDto {
  @ApiPropertyOptional({ description: 'Notas de la decisión del TSE' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitXdrDto {
  @ApiProperty({ description: 'XDR de la transferencia ya firmado por la wallet del vendedor (Freighter)' })
  @IsString()
  @IsNotEmpty()
  signedXdr!: string;
}
