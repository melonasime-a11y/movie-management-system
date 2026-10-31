import { Movie } from '../entities/movie.entity';

export const MOVIE_REPOSITORY = Symbol('MOVIE_REPOSITORY');

export interface MovieRepository {
  findAll(): Promise<Movie[]>;
  findById(id: number): Promise<Movie | null>;
  findByName(name: string): Promise<Movie | null>;
  save(movie: Movie): Promise<Movie>;
  delete(id: number): Promise<void>;
}
