import { DataSource } from 'typeorm';

import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';
import { Session } from '../../domain/entities/session.entity';
import { RoomAlreadyBookedError } from '../../domain/errors/room-already-booked.error';
import { SessionOrmEntity } from '../persistence/session.orm-entity';
import { TypeOrmSessionRepository } from './typeorm-session.repository';

describe('TypeOrmSessionRepository (SQLite)', () => {
  let dataSource: DataSource;
  let repository: TypeOrmSessionRepository;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [SessionOrmEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    repository = new TypeOrmSessionRepository(
      dataSource.getRepository(SessionOrmEntity),
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('translates a UNIQUE(roomNumber, date, timeSlot) violation into RoomAlreadyBookedError', async () => {
    await repository.save(
      Session.create({
        movieId: 1,
        date: '2026-11-03',
        timeSlot: SessionTimeSlot.SLOT_10_12,
        roomNumber: 1,
      }),
    );

    const conflict = Session.create({
      movieId: 2,
      date: '2026-11-03',
      timeSlot: SessionTimeSlot.SLOT_10_12,
      roomNumber: 1,
    });

    await expect(repository.save(conflict)).rejects.toBeInstanceOf(
      RoomAlreadyBookedError,
    );
  });
});
