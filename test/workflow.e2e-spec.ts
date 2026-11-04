import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

import { api, bearer, login, seedManager } from './utils/api';
import { closeE2eApp, createE2eApp } from './utils/e2e-app';

// The steps share state and run in declaration order, like a real client session.
describe('Complete ticket purchase workflow (e2e)', () => {
  let app: INestApplication<App>;

  const customer = { username: 'workflow-customer', password: 'secret123', age: 30 };
  const manager = { username: 'workflow-manager', password: 'manager123', age: 40 };

  let customerId: number;
  let customerToken: string;
  let managerToken: string;
  let movieId: number;
  let sessionId: number;
  let ticketId: number;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('1. registers a customer without exposing the password', async () => {
    const res = await api(app).post('/auth/register').send(customer).expect(201);

    expect(res.body).toEqual({
      id: expect.any(Number),
      username: customer.username,
      age: customer.age,
      role: 'customer',
      createdAt: expect.any(String),
    });
    customerId = (res.body as { id: number }).id;
  });

  it('2. logs the customer in and returns a JWT', async () => {
    const res = await api(app)
      .post('/auth/login')
      .send({ username: customer.username, password: customer.password })
      .expect(201);

    const { accessToken } = res.body as { accessToken: string };
    expect(accessToken.split('.')).toHaveLength(3);
    customerToken = accessToken;
  });

  it('3-4. seeds a manager through the test fixture and logs them in', async () => {
    const seeded = await seedManager(app, manager);
    managerToken = seeded.token;

    expect(await login(app, manager.username, manager.password)).toEqual(
      expect.any(String),
    );
  });

  it('5. manager creates a movie', async () => {
    const res = await api(app)
      .post('/movies')
      .set(bearer(managerToken))
      .send({ name: 'Inception', ageRestriction: 13 })
      .expect(201);

    expect(res.body).toMatchObject({ id: expect.any(Number), name: 'Inception', ageRestriction: 13 });
    movieId = (res.body as { id: number }).id;
  });

  it('6. manager creates a session for that movie', async () => {
    const res = await api(app)
      .post('/sessions')
      .set(bearer(managerToken))
      .send({ movieId, date: '2030-01-15', timeSlot: '18-20', roomNumber: 1 })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      movieId,
      date: '2030-01-15',
      timeSlot: '18-20',
      roomNumber: 1,
    });
    sessionId = (res.body as { id: number }).id;
  });

  it('7. customer buys a ticket for the session', async () => {
    const res = await api(app)
      .post('/tickets')
      .set(bearer(customerToken))
      .send({ sessionId })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      userId: customerId,
      sessionId,
      watched: false,
    });
    ticketId = (res.body as { id: number }).id;
  });

  it('8. rejects buying the same session ticket twice with 409', async () => {
    await api(app)
      .post('/tickets')
      .set(bearer(customerToken))
      .send({ sessionId })
      .expect(409, {
        message: 'Ticket for this session already exists',
        error: 'Conflict',
        statusCode: 409,
      });
  });

  it('lists the new ticket as unused and history as empty before watching', async () => {
    const unused = await api(app).get('/tickets/unused').set(bearer(customerToken)).expect(200);
    expect(unused.body).toEqual([expect.objectContaining({ id: ticketId, watched: false })]);

    await api(app).get('/tickets/history').set(bearer(customerToken)).expect(200, []);
  });

  it('9. customer watches their ticket', async () => {
    const res = await api(app)
      .post(`/tickets/${ticketId}/watch`)
      .set(bearer(customerToken))
      .expect(201);

    expect(res.body).toMatchObject({ id: ticketId, userId: customerId, watched: true });
  });

  it('10. the watched ticket appears in watch history', async () => {
    const res = await api(app).get('/tickets/history').set(bearer(customerToken)).expect(200);

    expect(res.body).toEqual([
      expect.objectContaining({ id: ticketId, sessionId, watched: true }),
    ]);
  });

  it('11. the watched ticket no longer appears in unused tickets', async () => {
    await api(app).get('/tickets/unused').set(bearer(customerToken)).expect(200, []);
  });

  it('rejects watching the same ticket again with 409', async () => {
    await api(app)
      .post(`/tickets/${ticketId}/watch`)
      .set(bearer(customerToken))
      .expect(409, {
        message: 'Ticket has already been watched',
        error: 'Conflict',
        statusCode: 409,
      });
  });
});
