import { ForbiddenError } from '../../../shared/domain/errors';

export class TicketAccessDeniedError extends ForbiddenError {
  constructor() {
    super('You do not have access to this ticket');
  }
}
