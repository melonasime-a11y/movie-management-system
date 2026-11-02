import { SessionTimeSlot } from '../entities/session-time-slot.enum';
import { Session } from '../entities/session.entity';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface SessionRepository {
  findAll(): Promise<Session[]>;
  findById(id: number): Promise<Session | null>;
  findByRoomDateAndTimeSlot(
    roomNumber: number,
    date: string,
    timeSlot: SessionTimeSlot,
  ): Promise<Session | null>;
  save(session: Session): Promise<Session>;
  delete(id: number): Promise<void>;
}
