import { ApiProperty } from '@nestjs/swagger';

import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';
import { Session } from '../../domain/entities/session.entity';

export class SessionResponseDto {
  @ApiProperty({ example: 1, nullable: true })
  id: number | null;

  @ApiProperty({ example: 1 })
  movieId: number;

  @ApiProperty({ example: '2026-11-03' })
  date: string;

  @ApiProperty({ enum: SessionTimeSlot, example: SessionTimeSlot.SLOT_10_12 })
  timeSlot: SessionTimeSlot;

  @ApiProperty({ example: 1 })
  roomNumber: number;

  @ApiProperty({ example: '2026-11-03T00:00:00.000Z', nullable: true })
  createdAt: Date | null;

  @ApiProperty({ example: '2026-11-03T00:00:00.000Z', nullable: true })
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
