import { Inject, Injectable } from '@nestjs/common';

import {
  TICKET_REPOSITORY,
  type TicketRepository,
} from '../../domain/repositories/ticket.repository';
import { TicketResponseDto } from '../dto/ticket-response.dto';

@Injectable()
export class GetUnusedTicketsUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: TicketRepository,
  ) {}

  async execute(userId: number): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketRepository.findUnusedByUser(userId);

    return tickets.map((ticket) => TicketResponseDto.fromDomain(ticket));
  }
}
