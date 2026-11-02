import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';
import { Session } from '../../domain/entities/session.entity';

export class SessionResponseDto {
  id: number | null;
  movieId: number;
  date: string;
  timeSlot: SessionTimeSlot;
  roomNumber: number;
  createdAt: Date | null;
  updatedAt: Date | null;

  static fromDomain(session: Session): SessionResponseDto {
    const dto = new SessionResponseDto();
    dto.id = session.id;
    dto.movieId = session.movieId;
    dto.date = session.date;
    dto.timeSlot = session.timeSlot;
    dto.roomNumber = session.roomNumber;
    dto.createdAt = session.createdAt;
    dto.updatedAt = session.updatedAt;
    return dto;
  }
}
