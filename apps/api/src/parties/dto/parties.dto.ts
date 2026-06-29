import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePartyDto {
  @ApiProperty({ example: 'PX', description: 'Código corto del partido' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Partido X' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
