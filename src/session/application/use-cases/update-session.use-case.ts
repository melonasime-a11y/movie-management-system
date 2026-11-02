import { Inject, Injectable } from '@nestjs/common';

import { MovieNotFoundError } from '../../../movie/domain/errors/movie-not-found.error';
import {
  MOVIE_REPOSITORY,
  type MovieRepository,
} from '../../../movie/domain/repositories/movie.repository';
import { RoomAlreadyBookedError } from '../../domain/errors/room-already-booked.error';
import { SessionNotFoundError } from '../../domain/errors/session-not-found.error';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import { SessionResponseDto } from '../dto/session-response.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';

@Injectable()
export class UpdateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: MovieRepository,
  ) {}

  async execute(id: number, dto: UpdateSessionDto): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new SessionNotFoundError(id);
    }

    if (dto.movieId !== undefined && dto.movieId !== session.movieId) {
      const movie = await this.movieRepository.findById(dto.movieId);

      if (!movie) {
        throw new MovieNotFoundError(dto.movieId);
      }
    }

    const nextRoomNumber = dto.roomNumber ?? session.roomNumber;
    const nextDate = dto.date ?? session.date;
    const nextTimeSlot = dto.timeSlot ?? session.timeSlot;

    const bookingChanged =
      nextRoomNumber !== session.roomNumber ||
      nextDate !== session.date ||
      nextTimeSlot !== session.timeSlot;

    if (bookingChanged) {
      const existingSession =
        await this.sessionRepository.findByRoomDateAndTimeSlot(
          nextRoomNumber,
          nextDate,
          nextTimeSlot,
        );

      if (existingSession && existingSession.id !== session.id) {
        throw new RoomAlreadyBookedError();
      }
    }

    session.update({
      movieId: dto.movieId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      roomNumber: dto.roomNumber,
    });

    const saved = await this.sessionRepository.save(session);

    return SessionResponseDto.fromDomain(saved);
  }
}
