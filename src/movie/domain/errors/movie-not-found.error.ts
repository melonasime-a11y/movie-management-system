import { NotFoundError } from '../../../shared/domain/errors';

export class MovieNotFoundError extends NotFoundError {
  constructor(id: number) {
    super(`Movie with id ${id} not found`);
  }
}
