import { Session } from '../../domain/entities/session.entity';
import { SessionOrmEntity } from './session.orm-entity';

export class SessionMapper {
  static toDomain(entity: SessionOrmEntity): Session {
    return Session.restore({
      id: entity.id,
      movieId: entity.movieId,
      date: entity.date,
      timeSlot: entity.timeSlot,
      roomNumber: entity.roomNumber,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(session: Session): SessionOrmEntity {
    const entity = new SessionOrmEntity();
    if (session.id !== null) {
      entity.id = session.id;
    }
    entity.movieId = session.movieId;
    entity.date = session.date;
    entity.timeSlot = session.timeSlot;
    entity.roomNumber = session.roomNumber;
    if (session.createdAt !== null) {
      entity.createdAt = session.createdAt;
    }
    if (session.updatedAt !== null) {
      entity.updatedAt = session.updatedAt;
    }
    return entity;
  }
}
