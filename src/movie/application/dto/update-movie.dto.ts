import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMovieDto {
  @ApiPropertyOptional({ example: 'Inception' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 16, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ageRestriction?: number;
}
