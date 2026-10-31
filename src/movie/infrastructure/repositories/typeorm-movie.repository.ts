import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Movie } from '../../domain/entities/movie.entity';
import { MovieNameAlreadyExistsError } from '../../domain/errors/movie-name-already-exists.error';
import { MovieRepository } from '../../domain/repositories/movie.repository';
import { MovieMapper } from '../persistence/movie.mapper';
import { MovieOrmEntity } from '../persistence/movie.orm-entity';

// `name` is the only UNIQUE column on `movies`; primary-key clashes report SQLITE_CONSTRAINT_PRIMARYKEY.
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code ===
      'SQLITE_CONSTRAINT_UNIQUE'
  );
}

@Injectable()
export class TypeOrmMovieRepository implements MovieRepository {
  constructor(
    @InjectRepository(MovieOrmEntity)
    private readonly repository: Repository<MovieOrmEntity>,
  ) {}

  async findAll(): Promise<Movie[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => MovieMapper.toDomain(entity));
  }

  async findById(id: number): Promise<Movie | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? MovieMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Movie | null> {
    const entity = await this.repository.findOne({ where: { name } });
    return entity ? MovieMapper.toDomain(entity) : null;
  }

  async save(movie: Movie): Promise<Movie> {
    try {
      const saved = await this.repository.save(MovieMapper.toPersistence(movie));
      return MovieMapper.toDomain(saved);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new MovieNameAlreadyExistsError();
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete({ id });
  }
}
