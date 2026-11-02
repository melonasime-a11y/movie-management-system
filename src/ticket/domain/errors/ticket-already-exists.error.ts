import { ConflictError } from '../../../shared/domain/errors';

export class TicketAlreadyExistsError extends ConflictError {
  constructor() {
    super('Ticket for this session already exists');
  }
}
