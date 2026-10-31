import { InMemoryMovieRepository } from '../../../../test/fakes/in-memory-movie.repository';
import { MovieNameAlreadyExistsError } from '../../domain/errors/movie-name-already-exists.error';
import { MovieNotFoundError } from '../../domain/errors/movie-not-found.error';
import { CreateMovieUseCase } from './create-movie.use-case';
import { DeleteMovieUseCase } from './delete-movie.use-case';
import { GetMovieByIdUseCase } from './get-movie-by-id.use-case';
import { GetMoviesUseCase } from './get-movies.use-case';
import { UpdateMovieUseCase } from './update-movie.use-case';

describe('Movie use cases', () => {
  let repository: InMemoryMovieRepository;

  beforeEach(() => {
    repository = new InMemoryMovieRepository();
  });

  it('creates a movie and lists it', async () => {
    const created = await new CreateMovieUseCase(repository).execute({
      name: 'Inception',
      ageRestriction: 13,
    });

    expect(created).toMatchObject({ id: 1, name: 'Inception', ageRestriction: 13 });
    await expect(new GetMoviesUseCase(repository).execute()).resolves.toHaveLength(1);
  });

  it('rejects a duplicate movie name', async () => {
    const createMovie = new CreateMovieUseCase(repository);
    await createMovie.execute({ name: 'Inception', ageRestriction: 13 });

    await expect(
      createMovie.execute({ name: 'Inception', ageRestriction: 18 }),
    ).rejects.toBeInstanceOf(MovieNameAlreadyExistsError);
  });

  it('throws MovieNotFoundError for a missing movie', async () => {
    await expect(new GetMovieByIdUseCase(repository).execute(42)).rejects.toThrow(
      new MovieNotFoundError(42),
    );
    await expect(
      new UpdateMovieUseCase(repository).execute(42, { name: 'X' }),
    ).rejects.toBeInstanceOf(MovieNotFoundError);
    await expect(new DeleteMovieUseCase(repository).execute(42)).rejects.toBeInstanceOf(
      MovieNotFoundError,
    );
  });

  it('updates only the provided fields', async () => {
    await new CreateMovieUseCase(repository).execute({ name: 'Inception', ageRestriction: 13 });

    const updated = await new UpdateMovieUseCase(repository).execute(1, {
      name: undefined,
      ageRestriction: 16,
    });

    expect(updated).toMatchObject({ id: 1, name: 'Inception', ageRestriction: 16 });
  });

  it('rejects renaming a movie to a name used by another movie', async () => {
    const createMovie = new CreateMovieUseCase(repository);
    await createMovie.execute({ name: 'Inception', ageRestriction: 13 });
    await createMovie.execute({ name: 'Alien', ageRestriction: 18 });

    await expect(
      new UpdateMovieUseCase(repository).execute(1, { name: 'Alien' }),
    ).rejects.toBeInstanceOf(MovieNameAlreadyExistsError);
    await expect(repository.findById(1)).resolves.toMatchObject({ name: 'Inception' });
  });

  it('allows an update that keeps the movie its own name', async () => {
    await new CreateMovieUseCase(repository).execute({ name: 'Inception', ageRestriction: 13 });

    const updated = await new UpdateMovieUseCase(repository).execute(1, {
      name: 'Inception',
      ageRestriction: 16,
    });

    expect(updated).toMatchObject({ id: 1, name: 'Inception', ageRestriction: 16 });
  });

  it('deletes a movie and returns it', async () => {
    await new CreateMovieUseCase(repository).execute({ name: 'Inception', ageRestriction: 13 });

    const deleted = await new DeleteMovieUseCase(repository).execute(1);

    expect(deleted).toMatchObject({ id: 1, name: 'Inception' });
    await expect(repository.findById(1)).resolves.toBeNull();
  });
});
