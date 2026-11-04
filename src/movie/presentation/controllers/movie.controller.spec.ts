import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { InMemoryMovieRepository } from '../../../../test/fakes/in-memory-movie.repository';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { getJwtSecret } from '../../../shared/infrastructure/config/jwt-secret';
import { DomainErrorFilter } from '../../../shared/presentation/filters/domain-error.filter';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { CreateMovieUseCase } from '../../application/use-cases/create-movie.use-case';
import { DeleteMovieUseCase } from '../../application/use-cases/delete-movie.use-case';
import { GetMovieByIdUseCase } from '../../application/use-cases/get-movie-by-id.use-case';
import { GetMoviesUseCase } from '../../application/use-cases/get-movies.use-case';
import { UpdateMovieUseCase } from '../../application/use-cases/update-movie.use-case';
import { MOVIE_REPOSITORY } from '../../domain/repositories/movie.repository';
import { MovieController } from './movie.controller';

describe('MovieController authorization (HTTP)', () => {
  let app: INestApplication<App>;
  let managerToken: string;
  let customerToken: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: getJwtSecret() }),
      ],
      controllers: [MovieController],
      providers: [
        { provide: MOVIE_REPOSITORY, useClass: InMemoryMovieRepository },
        { provide: APP_FILTER, useClass: DomainErrorFilter },
        CreateMovieUseCase,
        GetMoviesUseCase,
        GetMovieByIdUseCase,
        UpdateMovieUseCase,
        DeleteMovieUseCase,
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const jwt = moduleRef.get(JwtService);
    managerToken = await jwt.signAsync({ sub: 1, username: 'boss', role: UserRole.MANAGER });
    customerToken = await jwt.signAsync({ sub: 2, username: 'alice', role: UserRole.CUSTOMER });
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function seedMovie(name = 'Inception') {
    const res = await http()
      .post('/movies')
      .set(auth(managerToken))
      .send({ name, ageRestriction: 13 })
      .expect(201);
    return res.body as { id: number };
  }

  describe('without a JWT', () => {
    it.each([
      ['get', '/movies'],
      ['get', '/movies/1'],
      ['post', '/movies'],
      ['patch', '/movies/1'],
      ['delete', '/movies/1'],
    ] as const)('%s %s returns 401', async (method, path) => {
      await http()[method](path).expect(401);
    });
  });

  describe('legacy singular route', () => {
    it.each([
      ['get', '/movie'],
      ['get', '/movie/1'],
      ['post', '/movie'],
      ['patch', '/movie/1'],
      ['delete', '/movie/1'],
    ] as const)('%s %s is no longer mapped (404)', async (method, path) => {
      await http()[method](path).set(auth(managerToken)).expect(404);
    });
  });

  describe('as a customer', () => {
    it('can list and read movies', async () => {
      const movie = await seedMovie();

      await http().get('/movies').set(auth(customerToken)).expect(200);
      await http().get(`/movies/${movie.id}`).set(auth(customerToken)).expect(200);
    });

    it('is denied create, update and delete with 403', async () => {
      const movie = await seedMovie();

      await http()
        .post('/movies')
        .set(auth(customerToken))
        .send({ name: 'Alien', ageRestriction: 18 })
        .expect(403);
      await http()
        .patch(`/movies/${movie.id}`)
        .set(auth(customerToken))
        .send({ ageRestriction: 16 })
        .expect(403);
      await http().delete(`/movies/${movie.id}`).set(auth(customerToken)).expect(403);

      const res = await http().get(`/movies/${movie.id}`).set(auth(customerToken)).expect(200);
      expect(res.body).toMatchObject({ name: 'Inception', ageRestriction: 13 });
    });
  });

  describe('as a manager', () => {
    it('can create, update and delete movies', async () => {
      const movie = await seedMovie();

      await http()
        .patch(`/movies/${movie.id}`)
        .set(auth(managerToken))
        .send({ ageRestriction: 16 })
        .expect(200)
        .expect((res) => expect(res.body).toMatchObject({ name: 'Inception', ageRestriction: 16 }));
      await http().delete(`/movies/${movie.id}`).set(auth(managerToken)).expect(200);
      await http().get(`/movies/${movie.id}`).set(auth(managerToken)).expect(404);
    });

    it('gets 409 when creating or renaming to an existing name', async () => {
      await seedMovie('Inception');
      const alien = await seedMovie('Alien');

      await http()
        .post('/movies')
        .set(auth(managerToken))
        .send({ name: 'Inception', ageRestriction: 13 })
        .expect(409, { message: 'Movie name already exists', error: 'Conflict', statusCode: 409 });
      await http()
        .patch(`/movies/${alien.id}`)
        .set(auth(managerToken))
        .send({ name: 'Inception' })
        .expect(409, { message: 'Movie name already exists', error: 'Conflict', statusCode: 409 });
    });

    it('gets 404 when updating a movie that does not exist', async () => {
      await http()
        .patch('/movies/999')
        .set(auth(managerToken))
        .send({ name: 'Anything' })
        .expect(404, { message: 'Movie with id 999 not found', error: 'Not Found', statusCode: 404 });
    });
  });
});
