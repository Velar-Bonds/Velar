import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export type Perspectiva = 'usuario' | 'partido' | 'tse';

interface RegisterInput {
  email: string;
  password: string;
  perspectiva: Perspectiva;
  nombres?: string;
  apellidos?: string;
  identificacion?: string;
  telefono?: string;
  direccion?: string;
  // Partido
  nombrePartido?: string;
  codigo?: string;
  representanteLegal?: string;
  cedulaJuridica?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class LoginDto implements LoginInput {
  @ApiProperty({ example: 'comprador@velar.cr' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Velar12345!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterDto implements RegisterInput {
  @ApiProperty({ example: 'nuevo@velar.cr' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Velar12345!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: ['usuario', 'partido', 'tse'] })
  @IsIn(['usuario', 'partido', 'tse'])
  perspectiva!: Perspectiva;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identificacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ description: 'Requerido si perspectiva = partido' })
  @IsOptional()
  @IsString()
  nombrePartido?: string;

  @ApiPropertyOptional({ description: 'Requerido si perspectiva = partido' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  representanteLegal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cedulaJuridica?: string;
}
