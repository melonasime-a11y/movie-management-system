import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { UserRole } from '../../src/user/domain/entities/user-role.enum';
import { User } from '../../src/user/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../src/user/domain/repositories/user.repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../src/user/domain/services/password-hasher';

export interface Credentials {
  username: string;
  password: string;
  age: number;
}

export interface Actor {
  id: number;
  token: string;
}

export const api = (app: INestApplication<App>) => request(app.getHttpServer());

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function login(
  app: INestApplication<App>,
  username: string,
  password: string,
): Promise<string> {
  const res = await api(app)
    .post('/auth/login')
    .send({ username, password })
    .expect(201);

  return (res.body as { accessToken: string }).accessToken;
}

export async function registerCustomer(
  app: INestApplication<App>,
  credentials: Credentials,
): Promise<Actor> {
  const res = await api(app).post('/auth/register').send(credentials).expect(201);
  const { id } = res.body as { id: number };

  return {
    id,
    token: await login(app, credentials.username, credentials.password),
  };
}

// Test-only fixture: public registration always creates customers, so managers are seeded
// through the application's own user repository and password hasher.
export async function seedManager(
  app: INestApplication<App>,
  credentials: Credentials,
): Promise<Actor> {
  const users = app.get<UserRepository>(USER_REPOSITORY);
  const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

  const manager = await users.save(
    User.create({
      username: credentials.username,
      passwordHash: await hasher.hash(credentials.password),
      age: credentials.age,
      role: UserRole.MANAGER,
    }),
  );

  return {
    id: manager.id!,
    token: await login(app, credentials.username, credentials.password),
  };
}

export async function createMovie(
  app: INestApplication<App>,
  managerToken: string,
  body: { name: string; ageRestriction: number },
): Promise<{ id: number }> {
  const res = await api(app)
    .post('/movies')
    .set(bearer(managerToken))
    .send(body)
    .expect(201);

  return res.body as { id: number };
}

export async function createSession(
  app: INestApplication<App>,
  managerToken: string,
  body: { movieId: number; date: string; timeSlot: string; roomNumber: number },
): Promise<{ id: number }> {
  const res = await api(app)
    .post('/sessions')
    .set(bearer(managerToken))
    .send(body)
    .expect(201);

  return res.body as { id: number };
}

export async function buyTicket(
  app: INestApplication<App>,
  customerToken: string,
  sessionId: number,
): Promise<{ id: number }> {
  const res = await api(app)
    .post('/tickets')
    .set(bearer(customerToken))
    .send({ sessionId })
    .expect(201);

  return res.body as { id: number };
}
