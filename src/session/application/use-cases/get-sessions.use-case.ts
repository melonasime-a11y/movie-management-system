import { Inject, Injectable } from '@nestjs/common';

import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import { SessionResponseDto } from '../dto/session-response.dto';

@Injectable()
export class GetSessionsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.findAll();

    return sessions.map((session) => SessionResponseDto.fromDomain(session));
  }
}
