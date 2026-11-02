import { Inject, Injectable } from '@nestjs/common';

import { TicketAccessDeniedError } from '../../domain/errors/ticket-access-denied.error';
import { TicketAlreadyWatchedError } from '../../domain/errors/ticket-already-watched.error';
import { TicketNotFoundError } from '../../domain/errors/ticket-not-found.error';
import {
  TICKET_REPOSITORY,
  type TicketRepository,
} from '../../domain/repositories/ticket.repository';
import { TicketResponseDto } from '../dto/ticket-response.dto';

@Injectable()
export class WatchMovieUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: TicketRepository,
  ) {}

  async execute(userId: number, ticketId: number): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      throw new TicketNotFoundError(ticketId);
    }

    if (ticket.userId !== userId) {
      throw new TicketAccessDeniedError();
    }

    if (ticket.watched) {
      throw new TicketAlreadyWatchedError();
    }

    ticket.markAsWatched();

    const saved = await this.ticketRepository.save(ticket);

    return TicketResponseDto.fromDomain(saved);
  }
}
