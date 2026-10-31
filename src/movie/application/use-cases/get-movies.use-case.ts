import { Inject, Injectable } from '@nestjs/common';

import {
  MOVIE_REPOSITORY,
  type MovieRepository,
} from '../../domain/repositories/movie.repository';
import { MovieResponseDto } from '../dto/movie-response.dto';

@Injectable()
export class GetMoviesUseCase {
  constructor(
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: MovieRepository,
  ) {}

  async execute(): Promise<MovieResponseDto[]> {
    const movies = await this.movieRepository.findAll();

    return movies.map((movie) => MovieResponseDto.fromDomain(movie));
  }
}
