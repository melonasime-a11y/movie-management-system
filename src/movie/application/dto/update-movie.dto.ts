import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageRestriction?: number;
}
