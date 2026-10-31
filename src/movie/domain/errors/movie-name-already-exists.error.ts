import { ConflictError } from '../../../shared/domain/errors';

export class MovieNameAlreadyExistsError extends ConflictError {
  constructor() {
    super('Movie name already exists');
  }
}
