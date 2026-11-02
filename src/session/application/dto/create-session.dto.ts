import { IsDateString, IsEnum, IsInt, Matches, Min } from 'class-validator';

import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';

export class CreateSessionDto {
  @IsInt()
  @Min(1)
  movieId: number;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsEnum(SessionTimeSlot)
  timeSlot: SessionTimeSlot;

  @IsInt()
  @Min(1)
  roomNumber: number;
}
