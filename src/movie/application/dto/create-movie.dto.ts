import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({ example: 'Inception' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 13, minimum: 0 })
  @IsInt()
  @Min(0)
  ageRestriction: number;
}
