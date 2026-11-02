import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../domain/entities/user-role.enum';
import { User } from '../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1, nullable: true })
  id: number | null;

  @ApiProperty({ example: 'alice' })
  username: string;

  @ApiProperty({ example: 30 })
  age: number;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ example: '2026-11-03T00:00:00.000Z', nullable: true })
  createdAt: Date | null;

  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.age = user.age;
    dto.role = user.role;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
