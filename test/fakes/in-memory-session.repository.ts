import { SessionTimeSlot } from '../../src/session/domain/entities/session-time-slot.enum';
import { Session } from '../../src/session/domain/entities/session.entity';
import { SessionRepository } from '../../src/session/domain/repositories/session.repository';

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<number, Session>();
  private nextId = 1;

  async findAll() {
    return [...this.sessions.values()];
  }

  async findById(id: number) {
    return this.sessions.get(id) ?? null;
  }

  async findByRoomDateAndTimeSlot(
    roomNumber: number,
    date: string,
    timeSlot: SessionTimeSlot,
  ) {
    return (
      [...this.sessions.values()].find(
        (session) =>
          session.roomNumber === roomNumber &&
          session.date === date &&
          session.timeSlot === timeSlot,
      ) ?? null
    );
  }

  async save(session: Session) {
    const now = new Date();
    const saved = Session.restore({
      id: session.id ?? this.nextId++,
      movieId: session.movieId,
      date: session.date,
      timeSlot: session.timeSlot,
      roomNumber: session.roomNumber,
      createdAt: session.createdAt ?? now,
      updatedAt: now,
    });
    this.sessions.set(saved.id!, saved);
    return saved;
  }

  async delete(id: number) {
    this.sessions.delete(id);
  }
}
