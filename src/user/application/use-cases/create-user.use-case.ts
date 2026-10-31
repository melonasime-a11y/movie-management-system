import { Inject, Injectable } from '@nestjs/common';

import { User } from '../../domain/entities/user.entity';
import { UsernameAlreadyExistsError } from '../../domain/errors/username-already-exists.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repositories/user.repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../domain/services/password-hasher';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByUsername(dto.username);

    if (existingUser) {
      throw new UsernameAlreadyExistsError();
    }

    const user = User.create({
      username: dto.username,
      passwordHash: await this.passwordHasher.hash(dto.password),
      age: dto.age,
      role: dto.role,
    });

    const saved = await this.userRepository.save(user);

    return UserResponseDto.fromDomain(saved);
  }
}
