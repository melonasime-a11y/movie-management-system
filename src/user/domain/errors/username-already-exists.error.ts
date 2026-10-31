import { ConflictError } from '../../../shared/domain/errors';

export class UsernameAlreadyExistsError extends ConflictError {
  constructor() {
    super('Username already exists');
  }
}
