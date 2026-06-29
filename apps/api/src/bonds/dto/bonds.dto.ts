import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import type { BondRequestInput, RegisterBondInput } from '@velar/types';

export class CreateBondDto implements RegisterBondInput {
  @ApiProperty({ example: 'BOND-007' })
  @IsString()
  @IsNotEmpty()
  bondId!: string;

  @ApiProperty({ description: 'UUID del partido emisor' })
  @IsString()
  @IsNotEmpty()
  issuerPartyId!: string;

  @ApiProperty({ description: 'Hash del documento del bono' })
  @IsString()
  @IsNotEmpty()
  documentHash!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metadataUri?: string;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  faceValue?: number;

  @ApiPropertyOptional({ description: 'UUID del dueño inicial' })
  @IsOptional()
  @IsString()
  initialOwner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @ApiPropertyOptional({ example: 'CRC' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  interestRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsString()
  maturityDate?: string;
}

export class CreateBondRequestDto implements BondRequestInput {
  @ApiProperty({ example: 1000000 })
  @Type(() => Number)
  @IsNumber()
  faceValue!: number;

  @ApiPropertyOptional({ example: 'CRC' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  interestRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsString()
  maturityDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificateNumber?: string;
}

export class RejectBondRequestDto {
  @ApiPropertyOptional({ description: 'Motivo del rechazo' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class HashDocumentDto {
  @ApiProperty({ description: 'Contenido a hashear' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
