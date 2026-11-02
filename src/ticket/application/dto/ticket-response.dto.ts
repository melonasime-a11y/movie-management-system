import { ApiProperty } from '@nestjs/swagger';

import { Ticket } from '../../domain/entities/ticket.entity';

export class TicketResponseDto {
  @ApiProperty({ example: 1, nullable: true })
  id: number | null;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  sessionId: number;

  @ApiProperty({ example: false })
  watched: boolean;

  @ApiProperty({ example: '2026-11-03T00:00:00.000Z', nullable: true })
  createdAt: Date | null;

  @ApiProperty({ example: '2026-11-03T00:00:00.000Z', nullable: true })
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
