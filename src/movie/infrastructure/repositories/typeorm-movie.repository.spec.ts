import { DataSource } from 'typeorm';

import { Movie } from '../../domain/entities/movie.entity';
import { MovieNameAlreadyExistsError } from '../../domain/errors/movie-name-already-exists.error';
import { MovieOrmEntity } from '../persistence/movie.orm-entity';
import { TypeOrmMovieRepository } from './typeorm-movie.repository';

describe('TypeOrmMovieRepository (SQLite)', () => {
  let dataSource: DataSource;
  let repository: TypeOrmMovieRepository;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [MovieOrmEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    repository = new TypeOrmMovieRepository(dataSource.getRepository(MovieOrmEntity));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('translates a UNIQUE(name) violation into MovieNameAlreadyExistsError', async () => {
    await repository.save(Movie.create({ name: 'Inception', ageRestriction: 13 }));
    const alien = await repository.save(Movie.create({ name: 'Alien', ageRestriction: 18 }));

    alien.update({ name: 'Inception' });

    await expect(repository.save(alien)).rejects.toBeInstanceOf(MovieNameAlreadyExistsError);
  });
});
