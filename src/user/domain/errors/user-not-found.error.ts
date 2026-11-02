import { NotFoundError } from '../../../shared/domain/errors';

export class UserNotFoundError extends NotFoundError {
  constructor(id: number) {
    super(`User with id ${id} not found`);
  }
}
