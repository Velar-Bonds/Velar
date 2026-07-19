import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { CreateReportInput } from '../reports.service';

export class CreateReportDto implements CreateReportInput {
  @ApiProperty({ example: 'Reporte Mensual de Gastos — Enero 2026' })
  @IsString()
  @MinLength(8)
  title!: string;

  @ApiProperty({ example: 'Detalle de gastos operativos, viáticos y publicidad del partido' })
  @IsString()
  @MinLength(8)
  description!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsString()
  @IsOptional()
  period_start?: string;

  @ApiPropertyOptional({ example: '2026-01-31' })
  @IsString()
  @IsOptional()
  period_end?: string;

  @ApiPropertyOptional({ example: ['BOND-001', 'BOND-002'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bond_token_ids?: string[];

  @ApiPropertyOptional({ example: 152477 })
  @IsNumber()
  @IsOptional()
  total_amount?: number;
}

export const REPORT_STATUS = ['revisado', 'observado', 'aprobado'] as const;
export type ReportStatus = (typeof REPORT_STATUS)[number];

export class ReviewReportDto {
  @ApiProperty({ enum: REPORT_STATUS })
  @IsIn(REPORT_STATUS)
  status!: ReportStatus;

  @ApiPropertyOptional({ description: 'Notas de la revisión' })
  @IsOptional()
  @IsString()
  notes?: string;
}
