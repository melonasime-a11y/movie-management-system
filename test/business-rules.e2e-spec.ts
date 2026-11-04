import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

import {
  Actor,
  api,
  bearer,
  createMovie,
  createSession,
  registerCustomer,
  seedManager,
} from './utils/api';
import { closeE2eApp, createE2eApp } from './utils/e2e-app';

describe('Business rules, validation and missing resources (e2e)', () => {
  let app: INestApplication<App>;
  let manager: Actor;
  let adult: Actor;
  let teen: Actor;
  let restrictedMovieId: number;
  let restrictedSessionId: number;

  beforeAll(async () => {
    app = await createE2eApp();

    manager = await seedManager(app, { username: 'rules-manager', password: 'manager123', age: 40 });
    adult = await registerCustomer(app, { username: 'rules-adult', password: 'secret123', age: 30 });
    teen = await registerCustomer(app, { username: 'rules-teen', password: 'secret123', age: 15 });

    ({ id: restrictedMovieId } = await createMovie(app, manager.token, {
      name: 'Restricted Movie',
      ageRestriction: 18,
    }));
    ({ id: restrictedSessionId } = await createSession(app, manager.token, {
      movieId: restrictedMovieId,
      date: '2030-03-01',
      timeSlot: '20-22',
      roomNumber: 3,
    }));
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  describe('age restriction', () => {
    it('rejects an underage customer buying a restricted ticket with 403', async () => {
      await api(app)
        .post('/tickets')
        .set(bearer(teen.token))
        .send({ sessionId: restrictedSessionId })
        .expect(403, {
          message: 'Customer age does not meet the movie age restriction of 18',
          error: 'Forbidden',
          statusCode: 403,
        });

      await api(app).get('/tickets/unused').set(bearer(teen.token)).expect(200, []);
    });

    it('allows a customer who meets the age restriction', async () => {
      await api(app)
        .post('/tickets')
        .set(bearer(adult.token))
        .send({ sessionId: restrictedSessionId })
        .expect(201);
    });
  });

  describe('conflicts', () => {
    const roomConflict = {
      message: 'Room is already booked for this date and time slot',
      error: 'Conflict',
      statusCode: 409,
    };

    it('rejects double-booking a room on the same date and time slot with 409', async () => {
      await api(app)
        .post('/sessions')
        .set(bearer(manager.token))
        .send({ movieId: restrictedMovieId, date: '2030-03-01', timeSlot: '20-22', roomNumber: 3 })
        .expect(409, roomConflict);
    });

    it('rejects moving a session onto an already booked room slot with 409', async () => {
      const other = await createSession(app, manager.token, {
        movieId: restrictedMovieId,
        date: '2030-03-01',
        timeSlot: '22-00',
        roomNumber: 3,
      });

      await api(app)
        .patch(`/sessions/${other.id}`)
        .set(bearer(manager.token))
        .send({ timeSlot: '20-22' })
        .expect(409, roomConflict);
    });

    it('allows the same room on a different time slot', async () => {
      await api(app)
        .post('/sessions')
        .set(bearer(manager.token))
        .send({ movieId: restrictedMovieId, date: '2030-03-01', timeSlot: '18-20', roomNumber: 3 })
        .expect(201);
    });

    it('rejects a duplicate movie name with 409', async () => {
      await api(app)
        .post('/movies')
        .set(bearer(manager.token))
        .send({ name: 'Restricted Movie', ageRestriction: 12 })
        .expect(409, {
          message: 'Movie name already exists',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('rejects a duplicate username with 409', async () => {
      await api(app)
        .post('/auth/register')
        .send({ username: 'rules-adult', password: 'secret123', age: 30 })
        .expect(409);
    });
  });

  describe('invalid DTO data returns 400', () => {
    it.each([
      ['short password', { username: 'x-user', password: '123', age: 20 }],
      ['missing age', { username: 'x-user', password: 'secret123' }],
      ['non-positive age', { username: 'x-user', password: 'secret123', age: 0 }],
    ])('POST /auth/register with %s', async (_label, body) => {
      await api(app).post('/auth/register').send(body).expect(400);
    });

    it('POST /auth/login without a password', async () => {
      await api(app).post('/auth/login').send({ username: 'rules-adult' }).expect(400);
    });

    it.each([
      ['empty name', { name: '', ageRestriction: 10 }],
      ['negative ageRestriction', { name: 'Bad Movie', ageRestriction: -1 }],
      ['string ageRestriction', { name: 'Bad Movie', ageRestriction: '12' }],
      ['unknown property', { name: 'Bad Movie', ageRestriction: 10, rating: 5 }],
    ])('POST /movies with %s', async (_label, body) => {
      await api(app).post('/movies').set(bearer(manager.token)).send(body).expect(400);
    });

    it.each([
      ['invalid time slot', { timeSlot: '09-11' }],
      ['zero room number', { roomNumber: 0 }],
      ['non-ISO date', { date: '01-03-2030' }],
      ['impossible date', { date: '2030-13-45' }],
      ['missing movieId', { movieId: undefined }],
    ])('POST /sessions with %s', async (_label, override) => {
      const body = {
        movieId: restrictedMovieId,
        date: '2030-04-01',
        timeSlot: '10-12',
        roomNumber: 9,
        ...override,
      };

      await api(app).post('/sessions').set(bearer(manager.token)).send(body).expect(400);
    });

    it.each([
      ['string sessionId', { sessionId: 'abc' }],
      ['client-supplied userId', { sessionId: restrictedSessionId, userId: 1 }],
      ['missing sessionId', {}],
    ])('POST /tickets with %s', async (_label, body) => {
      await api(app).post('/tickets').set(bearer(adult.token)).send(body).expect(400);
    });

    it('rejects a non-numeric id route parameter', async () => {
      await api(app).get('/movies/abc').set(bearer(adult.token)).expect(400);
      await api(app).get('/sessions/abc').set(bearer(adult.token)).expect(400);
      await api(app).post('/tickets/abc/watch').set(bearer(adult.token)).expect(400);
    });
  });

  describe('unknown resources return 404', () => {
    const missingId = 999999;

    it('movies', async () => {
      await api(app)
        .get(`/movies/${missingId}`)
        .set(bearer(adult.token))
        .expect(404, {
          message: `Movie with id ${missingId} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
      await api(app)
        .patch(`/movies/${missingId}`)
        .set(bearer(manager.token))
        .send({ ageRestriction: 3 })
        .expect(404);
      await api(app).delete(`/movies/${missingId}`).set(bearer(manager.token)).expect(404);
    });

    it('sessions', async () => {
      await api(app)
        .get(`/sessions/${missingId}`)
        .set(bearer(adult.token))
        .expect(404, {
          message: `Session with id ${missingId} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
      await api(app)
        .patch(`/sessions/${missingId}`)
        .set(bearer(manager.token))
        .send({ roomNumber: 4 })
        .expect(404);
      await api(app).delete(`/sessions/${missingId}`).set(bearer(manager.token)).expect(404);
    });

    it('creating a session for a missing movie', async () => {
      await api(app)
        .post('/sessions')
        .set(bearer(manager.token))
        .send({ movieId: missingId, date: '2030-05-01', timeSlot: '10-12', roomNumber: 1 })
        .expect(404, {
          message: `Movie with id ${missingId} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('buying a ticket for a missing session', async () => {
      await api(app)
        .post('/tickets')
        .set(bearer(adult.token))
        .send({ sessionId: missingId })
        .expect(404, {
          message: `Session with id ${missingId} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('watching a missing ticket', async () => {
      await api(app)
        .post(`/tickets/${missingId}/watch`)
        .set(bearer(adult.token))
        .expect(404, {
          message: `Ticket with id ${missingId} not found`,
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('an unmapped route', async () => {
      await api(app).get('/does-not-exist').expect(404);
    });
  });
});
