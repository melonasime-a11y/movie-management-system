import { Movie } from '../../../movie/domain/entities/movie.entity';
import { MovieNotFoundError } from '../../../movie/domain/errors/movie-not-found.error';
import { InMemoryMovieRepository } from '../../../../test/fakes/in-memory-movie.repository';
import { InMemorySessionRepository } from '../../../../test/fakes/in-memory-session.repository';
import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';
import { RoomAlreadyBookedError } from '../../domain/errors/room-already-booked.error';
import { SessionNotFoundError } from '../../domain/errors/session-not-found.error';
import { CreateSessionUseCase } from './create-session.use-case';
import { DeleteSessionUseCase } from './delete-session.use-case';
import { GetSessionByIdUseCase } from './get-session-by-id.use-case';
import { GetSessionsUseCase } from './get-sessions.use-case';
import { UpdateSessionUseCase } from './update-session.use-case';

describe('Session use cases', () => {
  let sessionRepository: InMemorySessionRepository;
  let movieRepository: InMemoryMovieRepository;

  beforeEach(async () => {
    sessionRepository = new InMemorySessionRepository();
    movieRepository = new InMemoryMovieRepository();
    await movieRepository.save(
      Movie.create({ name: 'Inception', ageRestriction: 13 }),
    );
  });

  const createSession = () =>
    new CreateSessionUseCase(sessionRepository, movieRepository);

  const updateSession = () =>
    new UpdateSessionUseCase(sessionRepository, movieRepository);

  const validPayload = {
    movieId: 1,
    date: '2026-11-03',
    timeSlot: SessionTimeSlot.SLOT_10_12,
    roomNumber: 1,
  };

  it('creates a session and lists it', async () => {
    const created = await createSession().execute(validPayload);

    expect(created).toMatchObject({
      id: 1,
      movieId: 1,
      date: '2026-11-03',
      timeSlot: SessionTimeSlot.SLOT_10_12,
      roomNumber: 1,
    });
    await expect(
      new GetSessionsUseCase(sessionRepository).execute(),
    ).resolves.toHaveLength(1);
  });

  it('rejects a session for a missing movie', async () => {
    await expect(
      createSession().execute({ ...validPayload, movieId: 999 }),
    ).rejects.toBeInstanceOf(MovieNotFoundError);
  });

  it('rejects booking the same room, date and time slot twice', async () => {
    await createSession().execute(validPayload);

    await expect(createSession().execute(validPayload)).rejects.toBeInstanceOf(
      RoomAlreadyBookedError,
    );
  });

  it('allows the same room on a different time slot', async () => {
    await createSession().execute(validPayload);

    await expect(
      createSession().execute({
        ...validPayload,
        timeSlot: SessionTimeSlot.SLOT_12_14,
      }),
    ).resolves.toMatchObject({ id: 2, timeSlot: SessionTimeSlot.SLOT_12_14 });
  });

  it('throws SessionNotFoundError for a missing session', async () => {
    await expect(
      new GetSessionByIdUseCase(sessionRepository).execute(42),
    ).rejects.toThrow(new SessionNotFoundError(42));
    await expect(
      updateSession().execute(42, { roomNumber: 2 }),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
    await expect(
      new DeleteSessionUseCase(sessionRepository).execute(42),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });

  it('rejects updating onto another session booking', async () => {
    await createSession().execute(validPayload);
    const second = await createSession().execute({
      ...validPayload,
      timeSlot: SessionTimeSlot.SLOT_12_14,
    });

    await expect(
      updateSession().execute(second.id!, {
        timeSlot: SessionTimeSlot.SLOT_10_12,
      }),
    ).rejects.toBeInstanceOf(RoomAlreadyBookedError);
  });

  it('allows an update that keeps the session its own booking', async () => {
    await createSession().execute(validPayload);

    const updated = await updateSession().execute(1, {
      date: '2026-11-03',
      timeSlot: SessionTimeSlot.SLOT_10_12,
      roomNumber: 1,
    });

    expect(updated).toMatchObject({
      id: 1,
      date: '2026-11-03',
      timeSlot: SessionTimeSlot.SLOT_10_12,
      roomNumber: 1,
    });
  });

  it('rejects updating to a missing movie', async () => {
    await createSession().execute(validPayload);

    await expect(
      updateSession().execute(1, { movieId: 999 }),
    ).rejects.toBeInstanceOf(MovieNotFoundError);
  });

  it('deletes a session and returns it', async () => {
    await createSession().execute(validPayload);

    const deleted = await new DeleteSessionUseCase(sessionRepository).execute(1);

    expect(deleted).toMatchObject({ id: 1, movieId: 1 });
    await expect(sessionRepository.findById(1)).resolves.toBeNull();
  });
});
