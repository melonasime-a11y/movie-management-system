import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

import {
  Actor,
  api,
  bearer,
  buyTicket,
  createMovie,
  createSession,
  registerCustomer,
  seedManager,
} from './utils/api';
import { closeE2eApp, createE2eApp } from './utils/e2e-app';

describe('Authentication and authorization (e2e)', () => {
  let app: INestApplication<App>;
  let manager: Actor;
  let alice: Actor;
  let bob: Actor;
  let movieId: number;
  let sessionId: number;

  beforeAll(async () => {
    app = await createE2eApp();

    manager = await seedManager(app, { username: 'authz-manager', password: 'manager123', age: 40 });
    alice = await registerCustomer(app, { username: 'authz-alice', password: 'secret123', age: 30 });
    bob = await registerCustomer(app, { username: 'authz-bob', password: 'secret123', age: 30 });

    ({ id: movieId } = await createMovie(app, manager.token, {
      name: 'Authz Movie',
      ageRestriction: 0,
    }));
    ({ id: sessionId } = await createSession(app, manager.token, {
      movieId,
      date: '2030-02-01',
      timeSlot: '10-12',
      roomNumber: 1,
    }));
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  describe('missing or invalid JWT', () => {
    it.each([
      ['get', '/movies'],
      ['get', '/movies/1'],
      ['post', '/movies'],
      ['patch', '/movies/1'],
      ['delete', '/movies/1'],
      ['get', '/sessions'],
      ['get', '/sessions/1'],
      ['post', '/sessions'],
      ['patch', '/sessions/1'],
      ['delete', '/sessions/1'],
      ['post', '/tickets'],
      ['post', '/tickets/1/watch'],
      ['get', '/tickets/history'],
      ['get', '/tickets/unused'],
    ] as const)('%s %s without a token returns 401', async (method, path) => {
      await api(app)[method](path).expect(401);
    });

    it('rejects a malformed token with 401', async () => {
      await api(app).get('/movies').set(bearer('not-a-real-jwt')).expect(401, {
        message: 'Invalid or expired token',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('rejects a non-Bearer authorization header with 401', async () => {
      await api(app).get('/movies').set({ Authorization: 'Basic abc' }).expect(401);
    });
  });

  describe('public registration', () => {
    it('cannot be used to self-assign the manager role', async () => {
      await api(app)
        .post('/auth/register')
        .send({ username: 'wannabe-manager', password: 'secret123', age: 30, role: 'manager' })
        .expect(400);
    });
  });

  describe('customer restrictions', () => {
    it('can read movies and sessions', async () => {
      await api(app).get('/movies').set(bearer(alice.token)).expect(200);
      await api(app).get(`/movies/${movieId}`).set(bearer(alice.token)).expect(200);
      await api(app).get('/sessions').set(bearer(alice.token)).expect(200);
      await api(app).get(`/sessions/${sessionId}`).set(bearer(alice.token)).expect(200);
    });

    it('cannot create, update or delete movies (403)', async () => {
      await api(app)
        .post('/movies')
        .set(bearer(alice.token))
        .send({ name: 'Customer Movie', ageRestriction: 0 })
        .expect(403);
      await api(app)
        .patch(`/movies/${movieId}`)
        .set(bearer(alice.token))
        .send({ ageRestriction: 18 })
        .expect(403);
      await api(app).delete(`/movies/${movieId}`).set(bearer(alice.token)).expect(403);

      const res = await api(app).get(`/movies/${movieId}`).set(bearer(alice.token)).expect(200);
      expect(res.body).toMatchObject({ name: 'Authz Movie', ageRestriction: 0 });
    });

    it('cannot create, update or delete sessions (403)', async () => {
      await api(app)
        .post('/sessions')
        .set(bearer(alice.token))
        .send({ movieId, date: '2030-02-01', timeSlot: '12-14', roomNumber: 2 })
        .expect(403);
      await api(app)
        .patch(`/sessions/${sessionId}`)
        .set(bearer(alice.token))
        .send({ roomNumber: 5 })
        .expect(403);
      await api(app).delete(`/sessions/${sessionId}`).set(bearer(alice.token)).expect(403);

      const res = await api(app).get(`/sessions/${sessionId}`).set(bearer(alice.token)).expect(200);
      expect(res.body).toMatchObject({ roomNumber: 1, timeSlot: '10-12' });
    });
  });

  describe('manager restrictions', () => {
    it('cannot use customer-only ticket endpoints (403)', async () => {
      await api(app)
        .post('/tickets')
        .set(bearer(manager.token))
        .send({ sessionId })
        .expect(403);
      await api(app).get('/tickets/history').set(bearer(manager.token)).expect(403);
      await api(app).get('/tickets/unused').set(bearer(manager.token)).expect(403);
    });
  });

  describe('ticket ownership', () => {
    it("prevents a customer from watching another customer's ticket (403)", async () => {
      const ticket = await buyTicket(app, alice.token, sessionId);

      await api(app)
        .post(`/tickets/${ticket.id}/watch`)
        .set(bearer(bob.token))
        .expect(403, {
          message: 'You do not have access to this ticket',
          error: 'Forbidden',
          statusCode: 403,
        });

      await api(app).get('/tickets/unused').set(bearer(alice.token)).expect(200)
        .expect((res) => {
          expect(res.body).toEqual([expect.objectContaining({ id: ticket.id, watched: false })]);
        });
    });

    it("never returns another customer's tickets in history or unused lists", async () => {
      await api(app).get('/tickets/unused').set(bearer(bob.token)).expect(200, []);
      await api(app).get('/tickets/history').set(bearer(bob.token)).expect(200, []);
    });
  });
});
