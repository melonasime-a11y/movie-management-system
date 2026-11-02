import { ConflictError } from '../../../shared/domain/errors';

export class TicketAlreadyWatchedError extends ConflictError {
  constructor() {
    super('Ticket has already been watched');
  }
}
