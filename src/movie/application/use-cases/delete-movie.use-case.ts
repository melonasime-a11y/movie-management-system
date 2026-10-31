import { Inject, Injectable } from '@nestjs/common';

import { MovieNotFoundError } from '../../domain/errors/movie-not-found.error';
import {
  MOVIE_REPOSITORY,
  type MovieRepository,
} from '../../domain/repositories/movie.repository';
import { MovieResponseDto } from '../dto/movie-response.dto';

@Injectable()
export class DeleteMovieUseCase {
  constructor(
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: MovieRepository,
  ) {}

  async execute(id: number): Promise<MovieResponseDto> {
    const movie = await this.movieRepository.findById(id);

    if (!movie) {
      throw new MovieNotFoundError(id);
    }

    await this.movieRepository.delete(id);

    return MovieResponseDto.fromDomain(movie);
  }
}
