import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  ageRestriction: number;
}
