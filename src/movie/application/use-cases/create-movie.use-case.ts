import { Inject, Injectable } from '@nestjs/common';

import { Movie } from '../../domain/entities/movie.entity';
import { MovieNameAlreadyExistsError } from '../../domain/errors/movie-name-already-exists.error';
import {
  MOVIE_REPOSITORY,
  type MovieRepository,
} from '../../domain/repositories/movie.repository';
import { CreateMovieDto } from '../dto/create-movie.dto';
import { MovieResponseDto } from '../dto/movie-response.dto';

@Injectable()
export class CreateMovieUseCase {
  constructor(
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: MovieRepository,
  ) {}

  async execute(dto: CreateMovieDto): Promise<MovieResponseDto> {
    const existingMovie = await this.movieRepository.findByName(dto.name);

    if (existingMovie) {
      throw new MovieNameAlreadyExistsError();
    }

    const movie = Movie.create({
      name: dto.name,
      ageRestriction: dto.ageRestriction,
    });

    const saved = await this.movieRepository.save(movie);

    return MovieResponseDto.fromDomain(saved);
  }
}
