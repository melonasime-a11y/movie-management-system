import { Inject, Injectable } from '@nestjs/common';

import { MovieNotFoundError } from '../../../movie/domain/errors/movie-not-found.error';
import {
  MOVIE_REPOSITORY,
  type MovieRepository,
} from '../../../movie/domain/repositories/movie.repository';
import { SessionNotFoundError } from '../../../session/domain/errors/session-not-found.error';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../../session/domain/repositories/session.repository';
import { UserNotFoundError } from '../../../user/domain/errors/user-not-found.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../user/domain/repositories/user.repository';
import { Ticket } from '../../domain/entities/ticket.entity';
import { AgeRestrictionError } from '../../domain/errors/age-restriction.error';
import { TicketAlreadyExistsError } from '../../domain/errors/ticket-already-exists.error';
import {
  TICKET_REPOSITORY,
  type TicketRepository,
} from '../../domain/repositories/ticket.repository';
import { BuyTicketDto } from '../dto/buy-ticket.dto';
import { TicketResponseDto } from '../dto/ticket-response.dto';

@Injectable()
export class BuyTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: TicketRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: MovieRepository,
  ) {}

  async execute(
    userId: number,
    dto: BuyTicketDto,
  ): Promise<TicketResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const session = await this.sessionRepository.findById(dto.sessionId);

    if (!session) {
      throw new SessionNotFoundError(dto.sessionId);
    }

    const movie = await this.movieRepository.findById(session.movieId);

    if (!movie) {
      throw new MovieNotFoundError(session.movieId);
    }

    if (user.age < movie.ageRestriction) {
      throw new AgeRestrictionError(movie.ageRestriction);
    }

    const existingTicket = await this.ticketRepository.findByUserAndSession(
      userId,
      dto.sessionId,
    );

    if (existingTicket) {
      throw new TicketAlreadyExistsError();
    }

    const ticket = Ticket.create({
      userId,
      sessionId: dto.sessionId,
    });

    const saved = await this.ticketRepository.save(ticket);

    return TicketResponseDto.fromDomain(saved);
  }
}
