import { UserRole } from '../../domain/entities/user-role.enum';
import { User } from '../../domain/entities/user.entity';

export class UserResponseDto {
  id: number | null;
  username: string;
  age: number;
  role: UserRole;
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
