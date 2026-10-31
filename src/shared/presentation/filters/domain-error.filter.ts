import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import {
  AuthenticationError,
  ConflictError,
  DomainError,
  NotFoundError,
} from '../../domain/errors';

@Catch(DomainError)
export class DomainErrorFilter extends BaseExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    super.catch(this.toHttpException(error) ?? error, host);
  }

  private toHttpException(error: DomainError): HttpException | undefined {
    if (error instanceof NotFoundError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof ConflictError) {
      return new ConflictException(error.message);
    }
    if (error instanceof AuthenticationError) {
      return new UnauthorizedException(error.message);
    }
    return undefined;
  }
}
