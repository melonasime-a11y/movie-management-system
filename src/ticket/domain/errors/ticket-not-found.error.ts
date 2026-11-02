import { NotFoundError } from '../../../shared/domain/errors';

export class TicketNotFoundError extends NotFoundError {
  constructor(id: number) {
    super(`Ticket with id ${id} not found`);
  }
}
