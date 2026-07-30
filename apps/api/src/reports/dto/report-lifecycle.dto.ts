import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReportLineCategory } from '@velar/types';

const CATEGORIES = Object.values(ReportLineCategory);

export class CreateDraftDto {
  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(3000)
  periodYear!: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth!: number;

  @ApiPropertyOptional({ example: 'Reporte enero 2026' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class AddLineItemDto {
  @ApiProperty({ example: 'Bono SOL-2026-114' })
  @IsString()
  @IsNotEmpty()
  concept!: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: CATEGORIES, example: 'bono' })
  @IsIn(CATEGORIES)
  category!: ReportLineCategory;

  @ApiPropertyOptional({ description: 'Token id del bono declarado', nullable: true })
  @IsOptional()
  @IsString()
  bondTokenId?: string | null;
}
