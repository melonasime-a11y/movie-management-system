import { Movie } from '../../domain/entities/movie.entity';

export class MovieResponseDto {
  id: number | null;
  name: string;
  ageRestriction: number;
  createdAt: Date | null;
  updatedAt: Date | null;

  static fromDomain(movie: Movie): MovieResponseDto {
    const dto = new MovieResponseDto();
    dto.id = movie.id;
    dto.name = movie.name;
    dto.ageRestriction = movie.ageRestriction;
    dto.createdAt = movie.createdAt;
    dto.updatedAt = movie.updatedAt;
    return dto;
  }
}
