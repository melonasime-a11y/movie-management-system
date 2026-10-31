import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { CreateMovieUseCase } from './application/use-cases/create-movie.use-case';
import { DeleteMovieUseCase } from './application/use-cases/delete-movie.use-case';
import { GetMovieByIdUseCase } from './application/use-cases/get-movie-by-id.use-case';
import { GetMoviesUseCase } from './application/use-cases/get-movies.use-case';
import { UpdateMovieUseCase } from './application/use-cases/update-movie.use-case';
import { MOVIE_REPOSITORY } from './domain/repositories/movie.repository';
import { MovieOrmEntity } from './infrastructure/persistence/movie.orm-entity';
import { TypeOrmMovieRepository } from './infrastructure/repositories/typeorm-movie.repository';
import { MovieController } from './presentation/controllers/movie.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MovieOrmEntity]), AuthModule],
  controllers: [MovieController],
  providers: [
    { provide: MOVIE_REPOSITORY, useClass: TypeOrmMovieRepository },
    CreateMovieUseCase,
    GetMoviesUseCase,
    GetMovieByIdUseCase,
    UpdateMovieUseCase,
    DeleteMovieUseCase,
  ],
})
export class MovieModule {}
