import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsString,
    Min,
    MinLength,
  } from 'class-validator';
  import { UserRole } from '../entities/user.entity';
  
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