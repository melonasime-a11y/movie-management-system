import { Ticket } from '../../domain/entities/ticket.entity';

export class TicketResponseDto {
  id: number | null;
  userId: number;
  sessionId: number;
  watched: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;

  static fromDomain(ticket: Ticket): TicketResponseDto {
    const dto = new TicketResponseDto();
    dto.id = ticket.id;
    dto.userId = ticket.userId;
    dto.sessionId = ticket.sessionId;
    dto.watched = ticket.watched;
    dto.createdAt = ticket.createdAt;
    dto.updatedAt = ticket.updatedAt;
    return dto;
  }
}
