import { Ticket } from '../entities/ticket.entity';

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');

export interface TicketRepository {
  findById(id: number): Promise<Ticket | null>;
  findByUserAndSession(userId: number, sessionId: number): Promise<Ticket | null>;
  findWatchedByUser(userId: number): Promise<Ticket[]>;
  findUnusedByUser(userId: number): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<Ticket>;
}
