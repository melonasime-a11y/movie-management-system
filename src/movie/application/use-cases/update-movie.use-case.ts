import { Inject, Injectable } from '@nestjs/common';

import { MovieNameAlreadyExistsError } from '../../domain/errors/movie-name-already-exists.error';
import { MovieNotFoundError } from '../../domain/errors/movie-not-found.error';
import {
  MOVIE_REPOSITORY,
  type MovieRepository,
} from '../../domain/repositories/movie.repository';
import { MovieResponseDto } from '../dto/movie-response.dto';
import { UpdateMovieDto } from '../dto/update-movie.dto';

@Injectable()
export class UpdateMovieUseCase {
  constructor(
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: MovieRepository,
  ) {}

  async execute(id: number, dto: UpdateMovieDto): Promise<MovieResponseDto> {
    const movie = await this.movieRepository.findById(id);

    if (!movie) {
      throw new MovieNotFoundError(id);
    }

    if (dto.name !== undefined && dto.name !== movie.name) {
      const existingMovie = await this.movieRepository.findByName(dto.name);

      if (existingMovie) {
        throw new MovieNameAlreadyExistsError();
      }
    }

    movie.update({ name: dto.name, ageRestriction: dto.ageRestriction });

    const saved = await this.movieRepository.save(movie);

    return MovieResponseDto.fromDomain(saved);
  }
}
