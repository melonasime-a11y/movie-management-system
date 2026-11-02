import { ApiProperty } from '@nestjs/swagger';

import { Movie } from '../../domain/entities/movie.entity';

export class MovieResponseDto {
  @ApiProperty({ example: 1, nullable: true })
  id: number | null;

  @ApiProperty({ example: 'Inception' })
  name: string;

  @ApiProperty({ example: 13 })
  ageRestriction: number;

  @ApiProperty({ example: '2026-11-03T00:00:00.000Z', nullable: true })
  createdAt: Date | null;

  @ApiProperty({ example: '2026-11-03T00:00:00.000Z', nullable: true })
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
