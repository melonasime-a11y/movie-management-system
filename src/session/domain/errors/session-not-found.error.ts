import { NotFoundError } from '../../../shared/domain/errors';

export class SessionNotFoundError extends NotFoundError {
  constructor(id: number) {
    super(`Session with id ${id} not found`);
  }
}
