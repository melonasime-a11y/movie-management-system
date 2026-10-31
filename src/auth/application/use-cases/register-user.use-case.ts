import { Injectable } from '@nestjs/common';

import { UserResponseDto } from '../../../user/application/dto/user-response.dto';
import { CreateUserUseCase } from '../../../user/application/use-cases/create-user.use-case';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class RegisterUserUseCase {
  constructor(private readonly createUser: CreateUserUseCase) {}

  execute(dto: RegisterDto): Promise<UserResponseDto> {
    return this.createUser.execute({
      username: dto.username,
      password: dto.password,
      age: dto.age,
      role: UserRole.CUSTOMER,
    });
  }
}
