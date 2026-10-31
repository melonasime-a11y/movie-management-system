import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';

export class UserMapper {
  static toDomain(entity: UserOrmEntity): User {
    return User.restore({
      id: entity.id,
      username: entity.username,
      passwordHash: entity.password,
      age: entity.age,
      role: entity.role,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(user: User): UserOrmEntity {
    const entity = new UserOrmEntity();
    if (user.id !== null) {
      entity.id = user.id;
    }
    entity.username = user.username;
    entity.password = user.passwordHash;
    entity.age = user.age;
    entity.role = user.role;
    if (user.createdAt !== null) {
      entity.createdAt = user.createdAt;
    }
    return entity;
  }
}
