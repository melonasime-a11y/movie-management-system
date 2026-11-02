import { Movie } from '../../../movie/domain/entities/movie.entity';
import { SessionTimeSlot } from '../../../session/domain/entities/session-time-slot.enum';
import { Session } from '../../../session/domain/entities/session.entity';
import { SessionNotFoundError } from '../../../session/domain/errors/session-not-found.error';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { User } from '../../../user/domain/entities/user.entity';
import { InMemoryMovieRepository } from '../../../../test/fakes/in-memory-movie.repository';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository';
import { InMemoryTicketRepository } from '../../../../test/fakes/in-memory-ticket.repository';
import { AgeRestrictionError } from '../../domain/errors/age-restriction.error';
import { TicketAccessDeniedError } from '../../domain/errors/ticket-access-denied.error';
import { TicketAlreadyExistsError } from '../../domain/errors/ticket-already-exists.error';
import { TicketAlreadyWatchedError } from '../../domain/errors/ticket-already-watched.error';
import { BuyTicketUseCase } from './buy-ticket.use-case';
import { GetUnusedTicketsUseCase } from './get-unused-tickets.use-case';
import { GetWatchHistoryUseCase } from './get-watch-history.use-case';
import { WatchMovieUseCase } from './watch-movie.use-case';

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

describe('Ticket use cases', () => {
  let ticketRepository: InMemoryTicketRepository;
  let userRepository: InMemoryUserRepository;
  let sessionRepository: InMemorySessionRepository;
  let movieRepository: InMemoryMovieRepository;

  let buyTicket: BuyTicketUseCase;
  let watchMovie: WatchMovieUseCase;
  let getWatchHistory: GetWatchHistoryUseCase;
  let getUnusedTickets: GetUnusedTicketsUseCase;

  beforeEach(async () => {
    ticketRepository = new InMemoryTicketRepository();
    userRepository = new InMemoryUserRepository();
    sessionRepository = new InMemorySessionRepository();
    movieRepository = new InMemoryMovieRepository();

    buyTicket = new BuyTicketUseCase(
      ticketRepository,
      userRepository,
      sessionRepository,
      movieRepository,
    );
    watchMovie = new WatchMovieUseCase(ticketRepository);
    getWatchHistory = new GetWatchHistoryUseCase(ticketRepository);
    getUnusedTickets = new GetUnusedTicketsUseCase(ticketRepository);

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
        username: 'kid',
        passwordHash: 'hashed',
        age: 10,
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
  });

  it('buys a ticket successfully', async () => {
    const ticket = await buyTicket.execute(1, { sessionId: 1 });

    expect(ticket).toMatchObject({
      id: 1,
      userId: 1,
      sessionId: 1,
      watched: false,
    });
  });

  it('rejects a duplicate ticket for the same session', async () => {
    await buyTicket.execute(1, { sessionId: 1 });

    await expect(buyTicket.execute(1, { sessionId: 1 })).rejects.toBeInstanceOf(
      TicketAlreadyExistsError,
    );
  });

  it('rejects an underage customer', async () => {
    await expect(buyTicket.execute(2, { sessionId: 1 })).rejects.toBeInstanceOf(
      AgeRestrictionError,
    );
  });

  it('rejects a missing session', async () => {
    await expect(
      buyTicket.execute(1, { sessionId: 999 }),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });

  it('watches a valid ticket', async () => {
    const ticket = await buyTicket.execute(1, { sessionId: 1 });

    const watched = await watchMovie.execute(1, ticket.id!);

    expect(watched).toMatchObject({ id: ticket.id, watched: true });
  });

  it('cannot watch someone else ticket', async () => {
    const ticket = await buyTicket.execute(1, { sessionId: 1 });

    await expect(watchMovie.execute(3, ticket.id!)).rejects.toBeInstanceOf(
      TicketAccessDeniedError,
    );
  });

  it('rejects watching an already watched ticket', async () => {
    const ticket = await buyTicket.execute(1, { sessionId: 1 });
    await watchMovie.execute(1, ticket.id!);

    await expect(watchMovie.execute(1, ticket.id!)).rejects.toBeInstanceOf(
      TicketAlreadyWatchedError,
    );
  });

  it('watch history returns watched tickets only', async () => {
    await sessionRepository.save(
      Session.create({
        movieId: 1,
        date: '2026-11-04',
        timeSlot: SessionTimeSlot.SLOT_12_14,
        roomNumber: 1,
      }),
    );

    const first = await buyTicket.execute(1, { sessionId: 1 });
    await buyTicket.execute(1, { sessionId: 2 });
    await watchMovie.execute(1, first.id!);

    const history = await getWatchHistory.execute(1);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: first.id, watched: true });
  });

  it('unused tickets returns unwatched tickets only', async () => {
    await sessionRepository.save(
      Session.create({
        movieId: 1,
        date: '2026-11-04',
        timeSlot: SessionTimeSlot.SLOT_12_14,
        roomNumber: 1,
      }),
    );

    const first = await buyTicket.execute(1, { sessionId: 1 });
    const second = await buyTicket.execute(1, { sessionId: 2 });
    await watchMovie.execute(1, first.id!);

    const unused = await getUnusedTickets.execute(1);

    expect(unused).toHaveLength(1);
    expect(unused[0]).toMatchObject({ id: second.id, watched: false });
  });
});
