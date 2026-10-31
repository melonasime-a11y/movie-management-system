import { IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  @Min(1)
  age: number;
}