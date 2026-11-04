import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { InMemoryMovieRepository } from '../../../../test/fakes/in-memory-movie.repository';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository';
import { InMemoryTicketRepository } from '../../../../test/fakes/in-memory-ticket.repository';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Movie } from '../../../movie/domain/entities/movie.entity';
import { MOVIE_REPOSITORY } from '../../../movie/domain/repositories/movie.repository';
import { SessionTimeSlot } from '../../../session/domain/entities/session-time-slot.enum';
import { Session } from '../../../session/domain/entities/session.entity';
import { SESSION_REPOSITORY } from '../../../session/domain/repositories/session.repository';
import { getJwtSecret } from '../../../shared/infrastructure/config/jwt-secret';
import { DomainErrorFilter } from '../../../shared/presentation/filters/domain-error.filter';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { User } from '../../../user/domain/entities/user.entity';
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository';
import { BuyTicketUseCase } from '../../application/use-cases/buy-ticket.use-case';
import { GetUnusedTicketsUseCase } from '../../application/use-cases/get-unused-tickets.use-case';
import { GetWatchHistoryUseCase } from '../../application/use-cases/get-watch-history.use-case';
import { WatchMovieUseCase } from '../../application/use-cases/watch-movie.use-case';
import { TICKET_REPOSITORY } from '../../domain/repositories/ticket.repository';
import { TicketController } from './ticket.controller';

class InMemoryUserRepository {
  private users = new Map<number, User>();
  private nextId = 1;

  async findById(id: number) {
    return this.users.get(id) ?? null;
  }

  async findByUsername(username: string) {
    return (
      [...this.users.values()].find((user) => user.username === username) ?? null
    );
  }

  async save(user: User) {
    const saved = User.restore({
      id: user.id ?? this.nextId++,
      username: user.username,
      passwordHash: user.passwordHash,
      age: user.age,
      role: user.role,
      createdAt: user.createdAt ?? new Date(),
    });
    this.users.set(saved.id!, saved);
    return saved;
  }
}

describe('TicketController authorization (HTTP)', () => {
  let app: INestApplication<App>;
  let customerToken: string;
  let otherCustomerToken: string;
  let managerToken: string;

  beforeEach(async () => {
    const userRepository = new InMemoryUserRepository();
    const movieRepository = new InMemoryMovieRepository();
    const sessionRepository = new InMemorySessionRepository();

    await movieRepository.save(
      Movie.create({ name: 'Inception', ageRestriction: 13 }),
    );
    await sessionRepository.save(
      Session.create({
        movieId: 1,
        date: '2026-11-03',
        timeSlot: SessionTimeSlot.SLOT_10_12,
        roomNumber: 1,
      }),
    );
    await userRepository.save(
      User.create({
        username: 'alice',
        passwordHash: 'hashed',
        age: 30,
        role: UserRole.CUSTOMER,
      }),
    );
    await userRepository.save(
      User.create({
        username: 'bob',
        passwordHash: 'hashed',
        age: 25,
        role: UserRole.CUSTOMER,
      }),
    );
    await userRepository.save(
      User.create({
        username: 'kid',
        passwordHash: 'hashed',
        age: 10,
        role: UserRole.CUSTOMER,
      }),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: getJwtSecret(),
        }),
      ],
      controllers: [TicketController],
      providers: [
        { provide: TICKET_REPOSITORY, useClass: InMemoryTicketRepository },
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: SESSION_REPOSITORY, useValue: sessionRepository },
        { provide: MOVIE_REPOSITORY, useValue: movieRepository },
        { provide: APP_FILTER, useClass: DomainErrorFilter },
        BuyTicketUseCase,
        WatchMovieUseCase,
        GetWatchHistoryUseCase,
        GetUnusedTicketsUseCase,
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
    customerToken = await jwt.signAsync({
      sub: 1,
      username: 'alice',
      role: UserRole.CUSTOMER,
    });
    otherCustomerToken = await jwt.signAsync({
      sub: 2,
      username: 'bob',
      role: UserRole.CUSTOMER,
    });
    managerToken = await jwt.signAsync({
      sub: 99,
      username: 'boss',
      role: UserRole.MANAGER,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function buyTicket(token = customerToken, sessionId = 1) {
    const res = await http()
      .post('/tickets')
      .set(auth(token))
      .send({ sessionId })
      .expect(201);
    return res.body as { id: number; watched: boolean };
  }

  describe('without a JWT', () => {
    it.each([
      ['post', '/tickets'],
      ['get', '/tickets/history'],
      ['get', '/tickets/unused'],
      ['post', '/tickets/1/watch'],
    ] as const)('%s %s returns 401', async (method, path) => {
      await http()[method](path).expect(401);
    });
  });

  describe('as a manager', () => {
    it('is denied ticket endpoints with 403', async () => {
      await http()
        .post('/tickets')
        .set(auth(managerToken))
        .send({ sessionId: 1 })
        .expect(403);
      await http().get('/tickets/history').set(auth(managerToken)).expect(403);
      await http().get('/tickets/unused').set(auth(managerToken)).expect(403);
    });
  });

  describe('as a customer', () => {
    it('can buy, watch, and list own tickets', async () => {
      const ticket = await buyTicket();

      await http()
        .get('/tickets/unused')
        .set(auth(customerToken))
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({ id: ticket.id, watched: false });
        });

      await http()
        .post(`/tickets/${ticket.id}/watch`)
        .set(auth(customerToken))
        .expect(201)
        .expect((res) => expect(res.body).toMatchObject({ watched: true }));

      await http()
        .get('/tickets/history')
        .set(auth(customerToken))
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({ id: ticket.id, watched: true });
        });

      await http()
        .get('/tickets/unused')
        .set(auth(customerToken))
        .expect(200)
        .expect((res) => expect(res.body).toHaveLength(0));
    });

    it('rejects duplicate tickets with 409', async () => {
      await buyTicket();

      await http()
        .post('/tickets')
        .set(auth(customerToken))
        .send({ sessionId: 1 })
        .expect(409, {
          message: 'Ticket for this session already exists',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('rejects underage customers with 403', async () => {
      const jwt = app.get(JwtService);
      const kidToken = await jwt.signAsync({
        sub: 3,
        username: 'kid',
        role: UserRole.CUSTOMER,
      });

      await http()
        .post('/tickets')
        .set(auth(kidToken))
        .send({ sessionId: 1 })
        .expect(403);
    });

    it('rejects watching someone else ticket with 403', async () => {
      const ticket = await buyTicket();

      await http()
        .post(`/tickets/${ticket.id}/watch`)
        .set(auth(otherCustomerToken))
        .expect(403, {
          message: 'You do not have access to this ticket',
          error: 'Forbidden',
          statusCode: 403,
        });
    });

    it('rejects repeat watch with 409', async () => {
      const ticket = await buyTicket();
      await http()
        .post(`/tickets/${ticket.id}/watch`)
        .set(auth(customerToken))
        .expect(201);

      await http()
        .post(`/tickets/${ticket.id}/watch`)
        .set(auth(customerToken))
        .expect(409, {
          message: 'Ticket has already been watched',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('does not accept userId from the request body', async () => {
      await http()
        .post('/tickets')
        .set(auth(customerToken))
        .send({ sessionId: 1, userId: 2 })
        .expect(400);
    });
  });
});
