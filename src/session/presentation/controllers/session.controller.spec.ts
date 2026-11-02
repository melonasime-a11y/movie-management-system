import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { InMemoryMovieRepository } from '../../../../test/fakes/in-memory-movie.repository';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Movie } from '../../../movie/domain/entities/movie.entity';
import { MOVIE_REPOSITORY } from '../../../movie/domain/repositories/movie.repository';
import { DomainErrorFilter } from '../../../shared/presentation/filters/domain-error.filter';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { DeleteSessionUseCase } from '../../application/use-cases/delete-session.use-case';
import { GetSessionByIdUseCase } from '../../application/use-cases/get-session-by-id.use-case';
import { GetSessionsUseCase } from '../../application/use-cases/get-sessions.use-case';
import { UpdateSessionUseCase } from '../../application/use-cases/update-session.use-case';
import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';
import { SESSION_REPOSITORY } from '../../domain/repositories/session.repository';
import { SessionController } from './session.controller';

describe('SessionController authorization (HTTP)', () => {
  let app: INestApplication<App>;
  let managerToken: string;
  let customerToken: string;
  let movieRepository: InMemoryMovieRepository;

  beforeEach(async () => {
    movieRepository = new InMemoryMovieRepository();
    await movieRepository.save(
      Movie.create({ name: 'Inception', ageRestriction: 13 }),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'development-secret',
        }),
      ],
      controllers: [SessionController],
      providers: [
        { provide: SESSION_REPOSITORY, useClass: InMemorySessionRepository },
        { provide: MOVIE_REPOSITORY, useValue: movieRepository },
        { provide: APP_FILTER, useClass: DomainErrorFilter },
        CreateSessionUseCase,
        GetSessionsUseCase,
        GetSessionByIdUseCase,
        UpdateSessionUseCase,
        DeleteSessionUseCase,
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const jwt = moduleRef.get(JwtService);
    managerToken = await jwt.signAsync({
      sub: 1,
      username: 'boss',
      role: UserRole.MANAGER,
    });
    customerToken = await jwt.signAsync({
      sub: 2,
      username: 'alice',
      role: UserRole.CUSTOMER,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const validBody = {
    movieId: 1,
    date: '2026-11-03',
    timeSlot: SessionTimeSlot.SLOT_10_12,
    roomNumber: 1,
  };

  async function seedSession(
    overrides: Partial<typeof validBody> = {},
  ) {
    const res = await http()
      .post('/sessions')
      .set(auth(managerToken))
      .send({ ...validBody, ...overrides })
      .expect(201);
    return res.body as { id: number };
  }

  describe('without a JWT', () => {
    it.each([
      ['get', '/sessions'],
      ['get', '/sessions/1'],
      ['post', '/sessions'],
      ['patch', '/sessions/1'],
      ['delete', '/sessions/1'],
    ] as const)('%s %s returns 401', async (method, path) => {
      await http()[method](path).expect(401);
    });
  });

  describe('as a customer', () => {
    it('can list and read sessions', async () => {
      const session = await seedSession();

      await http().get('/sessions').set(auth(customerToken)).expect(200);
      await http()
        .get(`/sessions/${session.id}`)
        .set(auth(customerToken))
        .expect(200);
    });

    it('is denied create, update and delete with 403', async () => {
      const session = await seedSession();

      await http()
        .post('/sessions')
        .set(auth(customerToken))
        .send({
          ...validBody,
          timeSlot: SessionTimeSlot.SLOT_12_14,
        })
        .expect(403);
      await http()
        .patch(`/sessions/${session.id}`)
        .set(auth(customerToken))
        .send({ roomNumber: 2 })
        .expect(403);
      await http()
        .delete(`/sessions/${session.id}`)
        .set(auth(customerToken))
        .expect(403);

      const res = await http()
        .get(`/sessions/${session.id}`)
        .set(auth(customerToken))
        .expect(200);
      expect(res.body).toMatchObject({ roomNumber: 1 });
    });
  });

  describe('as a manager', () => {
    it('can create, update and delete sessions', async () => {
      const session = await seedSession();

      await http()
        .patch(`/sessions/${session.id}`)
        .set(auth(managerToken))
        .send({ roomNumber: 2 })
        .expect(200)
        .expect((res) =>
          expect(res.body).toMatchObject({
            movieId: 1,
            roomNumber: 2,
            timeSlot: SessionTimeSlot.SLOT_10_12,
          }),
        );
      await http()
        .delete(`/sessions/${session.id}`)
        .set(auth(managerToken))
        .expect(200);
      await http()
        .get(`/sessions/${session.id}`)
        .set(auth(managerToken))
        .expect(404);
    });

    it('gets 409 when booking an already taken room slot', async () => {
      await seedSession();

      await http()
        .post('/sessions')
        .set(auth(managerToken))
        .send(validBody)
        .expect(409, {
          message: 'Room is already booked for this date and time slot',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('gets 404 when the movie does not exist', async () => {
      await http()
        .post('/sessions')
        .set(auth(managerToken))
        .send({ ...validBody, movieId: 999 })
        .expect(404, {
          message: 'Movie with id 999 not found',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('gets 404 when updating a session that does not exist', async () => {
      await http()
        .patch('/sessions/999')
        .set(auth(managerToken))
        .send({ roomNumber: 2 })
        .expect(404, {
          message: 'Session with id 999 not found',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('rejects invalid time slots and room numbers', async () => {
      await http()
        .post('/sessions')
        .set(auth(managerToken))
        .send({ ...validBody, timeSlot: '09-11' })
        .expect(400);
      await http()
        .post('/sessions')
        .set(auth(managerToken))
        .send({ ...validBody, roomNumber: 0 })
        .expect(400);
      await http()
        .post('/sessions')
        .set(auth(managerToken))
        .send({ ...validBody, date: '03-11-2026' })
        .expect(400);
    });
  });
});
