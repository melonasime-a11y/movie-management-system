import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../domain/entities/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  @Min(1)
  age: number;

  @IsEnum(UserRole)
  role: UserRole;
}
