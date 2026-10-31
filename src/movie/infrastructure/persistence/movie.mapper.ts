import { Movie } from '../../domain/entities/movie.entity';
import { MovieOrmEntity } from './movie.orm-entity';

export class MovieMapper {
  static toDomain(entity: MovieOrmEntity): Movie {
    return Movie.restore({
      id: entity.id,
      name: entity.name,
      ageRestriction: entity.ageRestriction,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(movie: Movie): MovieOrmEntity {
    const entity = new MovieOrmEntity();
    if (movie.id !== null) {
      entity.id = movie.id;
    }
    entity.name = movie.name;
    entity.ageRestriction = movie.ageRestriction;
    if (movie.createdAt !== null) {
      entity.createdAt = movie.createdAt;
    }
    if (movie.updatedAt !== null) {
      entity.updatedAt = movie.updatedAt;
    }
    return entity;
  }
}
