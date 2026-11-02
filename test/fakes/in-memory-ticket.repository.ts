import { Ticket } from '../../src/ticket/domain/entities/ticket.entity';
import { TicketRepository } from '../../src/ticket/domain/repositories/ticket.repository';

export class InMemoryTicketRepository implements TicketRepository {
  private tickets = new Map<number, Ticket>();
  private nextId = 1;

  async findById(id: number) {
    return this.tickets.get(id) ?? null;
  }

  async findByUserAndSession(userId: number, sessionId: number) {
    return (
      [...this.tickets.values()].find(
        (ticket) => ticket.userId === userId && ticket.sessionId === sessionId,
      ) ?? null
    );
  }

  async findWatchedByUser(userId: number) {
    return [...this.tickets.values()].filter(
      (ticket) => ticket.userId === userId && ticket.watched,
    );
  }

  async findUnusedByUser(userId: number) {
    return [...this.tickets.values()].filter(
      (ticket) => ticket.userId === userId && !ticket.watched,
    );
  }

  async save(ticket: Ticket) {
    const now = new Date();
    const saved = Ticket.restore({
      id: ticket.id ?? this.nextId++,
      userId: ticket.userId,
      sessionId: ticket.sessionId,
      watched: ticket.watched,
      createdAt: ticket.createdAt ?? now,
      updatedAt: now,
    });
    this.tickets.set(saved.id!, saved);
    return saved;
  }
}
