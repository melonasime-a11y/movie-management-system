import { Inject, Injectable } from '@nestjs/common';

import { SessionNotFoundError } from '../../domain/errors/session-not-found.error';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import { SessionResponseDto } from '../dto/session-response.dto';

@Injectable()
export class GetSessionByIdUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(id: number): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new SessionNotFoundError(id);
    }

    return SessionResponseDto.fromDomain(session);
  }
}
