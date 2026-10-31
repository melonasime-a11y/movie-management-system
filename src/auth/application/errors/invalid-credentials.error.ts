import { AuthenticationError } from '../../../shared/domain/errors';

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid username or password');
  }
}
