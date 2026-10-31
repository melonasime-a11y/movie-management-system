import { Movie } from '../../src/movie/domain/entities/movie.entity';
import { MovieRepository } from '../../src/movie/domain/repositories/movie.repository';

export class InMemoryMovieRepository implements MovieRepository {
  private movies = new Map<number, Movie>();
  private nextId = 1;

  async findAll() {
    return [...this.movies.values()];
  }

  async findById(id: number) {
    return this.movies.get(id) ?? null;
  }

  async findByName(name: string) {
    return [...this.movies.values()].find((m) => m.name === name) ?? null;
  }

  async save(movie: Movie) {
    const now = new Date();
    const saved = Movie.restore({
      id: movie.id ?? this.nextId++,
      name: movie.name,
      ageRestriction: movie.ageRestriction,
      createdAt: movie.createdAt ?? now,
      updatedAt: now,
    });
    this.movies.set(saved.id!, saved);
    return saved;
  }

  async delete(id: number) {
    this.movies.delete(id);
  }
}
