import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketOrmEntity } from './ticket.orm-entity';

export class TicketMapper {
  static toDomain(entity: TicketOrmEntity): Ticket {
    return Ticket.restore({
      id: entity.id,
      userId: entity.userId,
      sessionId: entity.sessionId,
      watched: entity.watched,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(ticket: Ticket): TicketOrmEntity {
    const entity = new TicketOrmEntity();
    if (ticket.id !== null) {
      entity.id = ticket.id;
    }
    entity.userId = ticket.userId;
    entity.sessionId = ticket.sessionId;
    entity.watched = ticket.watched;
    if (ticket.createdAt !== null) {
      entity.createdAt = ticket.createdAt;
    }
    if (ticket.updatedAt !== null) {
      entity.updatedAt = ticket.updatedAt;
    }
    return entity;
  }
}
