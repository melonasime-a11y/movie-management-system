import { JwtService } from '@nestjs/jwt';

import { CreateUserUseCase } from '../../../user/application/use-cases/create-user.use-case';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { User } from '../../../user/domain/entities/user.entity';
import { UsernameAlreadyExistsError } from '../../../user/domain/errors/username-already-exists.error';
import { UserRepository } from '../../../user/domain/repositories/user.repository';
import { PasswordHasher } from '../../../user/domain/services/password-hasher';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';
import { LoginUserUseCase } from './login-user.use-case';
import { RegisterUserUseCase } from './register-user.use-case';

class InMemoryUserRepository implements UserRepository {
  users: User[] = [];

  async findById(id: number) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByUsername(username: string) {
    return this.users.find((u) => u.username === username) ?? null;
  }

  async save(user: User) {
    const saved = User.restore({
      id: this.users.length + 1,
      username: user.username,
      passwordHash: user.passwordHash,
      age: user.age,
      role: user.role,
      createdAt: new Date(),
    });
    this.users.push(saved);
    return saved;
  }
}

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  compare: async (plain, hash) => hash === `hashed:${plain}`,
};

describe('Auth use cases', () => {
  const jwtService = new JwtService({ secret: 'test-secret' });
  let repository: InMemoryUserRepository;
  let register: RegisterUserUseCase;
  let login: LoginUserUseCase;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    register = new RegisterUserUseCase(new CreateUserUseCase(repository, fakeHasher));
    login = new LoginUserUseCase(repository, fakeHasher, jwtService);
  });

  it('registers a customer, hashes the password and never returns it', async () => {
    const result = await register.execute({ username: 'alice', password: 'secret123', age: 30 });

    expect(result).toEqual({
      id: 1,
      username: 'alice',
      age: 30,
      role: UserRole.CUSTOMER,
      createdAt: expect.any(Date),
    });
    expect(result).not.toHaveProperty('password');
    expect(repository.users[0].passwordHash).toBe('hashed:secret123');
  });

  it('rejects a duplicate username', async () => {
    await register.execute({ username: 'alice', password: 'secret123', age: 30 });

    await expect(
      register.execute({ username: 'alice', password: 'other123', age: 20 }),
    ).rejects.toBeInstanceOf(UsernameAlreadyExistsError);
  });

  it('issues a JWT with sub, username and role on valid credentials', async () => {
    await register.execute({ username: 'alice', password: 'secret123', age: 30 });

    const { accessToken } = await login.execute({ username: 'alice', password: 'secret123' });

    await expect(jwtService.verifyAsync(accessToken)).resolves.toMatchObject({
      sub: 1,
      username: 'alice',
      role: UserRole.CUSTOMER,
    });
  });

  it('rejects unknown users and wrong passwords the same way', async () => {
    await register.execute({ username: 'alice', password: 'secret123', age: 30 });

    await expect(login.execute({ username: 'bob', password: 'secret123' })).rejects.toThrow(
      new InvalidCredentialsError(),
    );
    await expect(login.execute({ username: 'alice', password: 'wrong' })).rejects.toThrow(
      new InvalidCredentialsError(),
    );
  });
});
