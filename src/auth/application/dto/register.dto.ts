import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'alice' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'secret123',
    minLength: 6,
    format: 'password',
    writeOnly: true,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 30, minimum: 1 })
  @IsInt()
  @Min(1)
  age: number;
}
