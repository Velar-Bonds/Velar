import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { COUNTRY_CODES, type CountryCode } from '@velar/types';
import type {
  CreateContractTemplateRequest,
  CreateContractVersionRequest,
  UpsertContractClauseRequest,
} from '@velar/types';

const CLAUSE_CATEGORIES = [
  'partes', 'objeto', 'pago', 'transferencia', 'garantia', 'plazo', 'incumplimiento', 'jurisdiccion', 'firmas', 'otro',
] as const;

export class CreateContractTemplateDto implements CreateContractTemplateRequest {
  @ApiProperty({ example: 'bond-transfer-cr' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ enum: COUNTRY_CODES })
  @IsIn(COUNTRY_CODES)
  country!: CountryCode;

  @ApiProperty({ example: 'Contrato de transferencia de bono político — Costa Rica' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateContractVersionDto implements CreateContractVersionRequest {
  @ApiProperty({ type: [String], example: ['clause-partes', 'clause-objeto', 'clause-pago'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  clauseKeys!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpsertContractClauseDto implements UpsertContractClauseRequest {
  @ApiProperty({ example: 'clause-pago' })
  @IsString()
  @IsNotEmpty()
  clauseKey!: string;

  @ApiProperty({ enum: CLAUSE_CATEGORIES })
  @IsIn(CLAUSE_CATEGORIES)
  category!: (typeof CLAUSE_CATEGORIES)[number];

  @ApiProperty({ example: 'Cláusula — Precio y forma de pago' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'El precio será {{amount}} {{currency}}...' })
  @IsString()
  @IsNotEmpty()
  bodyTemplate!: string;

  @ApiPropertyOptional({ type: [String], example: ['amount', 'currency'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parameters?: string[];

  @ApiPropertyOptional({ example: 'es' })
  @IsOptional()
  @IsString()
  locale?: string;
}
