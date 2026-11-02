import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';
import { Session } from '../../domain/entities/session.entity';
import { RoomAlreadyBookedError } from '../../domain/errors/room-already-booked.error';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionMapper } from '../persistence/session.mapper';
import { SessionOrmEntity } from '../persistence/session.orm-entity';

// The only UNIQUE constraint on `sessions` is (roomNumber, date, timeSlot).
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code ===
      'SQLITE_CONSTRAINT_UNIQUE'
  );
}

@Injectable()
export class TypeOrmSessionRepository implements SessionRepository {
  constructor(
    @InjectRepository(SessionOrmEntity)
    private readonly repository: Repository<SessionOrmEntity>,
  ) {}

  async findAll(): Promise<Session[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => SessionMapper.toDomain(entity));
  }

  async findById(id: number): Promise<Session | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? SessionMapper.toDomain(entity) : null;
  }

  async findByRoomDateAndTimeSlot(
    roomNumber: number,
    date: string,
    timeSlot: SessionTimeSlot,
  ): Promise<Session | null> {
    const entity = await this.repository.findOne({
      where: { roomNumber, date, timeSlot },
    });
    return entity ? SessionMapper.toDomain(entity) : null;
  }

  async save(session: Session): Promise<Session> {
    try {
      const saved = await this.repository.save(
        SessionMapper.toPersistence(session),
      );
      return SessionMapper.toDomain(saved);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new RoomAlreadyBookedError();
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete({ id });
  }
}
