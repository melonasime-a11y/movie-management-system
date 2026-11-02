import { Inject, Injectable } from '@nestjs/common';

import { MovieNotFoundError } from '../../../movie/domain/errors/movie-not-found.error';
import {
  MOVIE_REPOSITORY,
  type MovieRepository,
} from '../../../movie/domain/repositories/movie.repository';
import { Session } from '../../domain/entities/session.entity';
import { RoomAlreadyBookedError } from '../../domain/errors/room-already-booked.error';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionResponseDto } from '../dto/session-response.dto';

@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: MovieRepository,
  ) {}

  async execute(dto: CreateSessionDto): Promise<SessionResponseDto> {
    const movie = await this.movieRepository.findById(dto.movieId);

    if (!movie) {
      throw new MovieNotFoundError(dto.movieId);
    }

    const existingSession = await this.sessionRepository.findByRoomDateAndTimeSlot(
      dto.roomNumber,
      dto.date,
      dto.timeSlot,
    );

    if (existingSession) {
      throw new RoomAlreadyBookedError();
    }

    const session = Session.create({
      movieId: dto.movieId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      roomNumber: dto.roomNumber,
    });

    const saved = await this.sessionRepository.save(session);

    return SessionResponseDto.fromDomain(saved);
  }
}
