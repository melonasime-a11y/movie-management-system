import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketAlreadyExistsError } from '../../domain/errors/ticket-already-exists.error';
import { TicketRepository } from '../../domain/repositories/ticket.repository';
import { TicketMapper } from '../persistence/ticket.mapper';
import { TicketOrmEntity } from '../persistence/ticket.orm-entity';

// The only UNIQUE constraint on `tickets` is (userId, sessionId).
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code ===
      'SQLITE_CONSTRAINT_UNIQUE'
  );
}

@Injectable()
export class TypeOrmTicketRepository implements TicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repository: Repository<TicketOrmEntity>,
  ) {}

  async findById(id: number): Promise<Ticket | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? TicketMapper.toDomain(entity) : null;
  }

  async findByUserAndSession(
    userId: number,
    sessionId: number,
  ): Promise<Ticket | null> {
    const entity = await this.repository.findOne({
      where: { userId, sessionId },
    });
    return entity ? TicketMapper.toDomain(entity) : null;
  }

  async findWatchedByUser(userId: number): Promise<Ticket[]> {
    const entities = await this.repository.find({
      where: { userId, watched: true },
    });
    return entities.map((entity) => TicketMapper.toDomain(entity));
  }

  async findUnusedByUser(userId: number): Promise<Ticket[]> {
    const entities = await this.repository.find({
      where: { userId, watched: false },
    });
    return entities.map((entity) => TicketMapper.toDomain(entity));
  }

  async save(ticket: Ticket): Promise<Ticket> {
    try {
      const saved = await this.repository.save(
        TicketMapper.toPersistence(ticket),
      );
      return TicketMapper.toDomain(saved);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new TicketAlreadyExistsError();
      }
      throw error;
    }
  }
}
