import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, Matches, Min } from 'class-validator';

import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';

export class CreateSessionDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  movieId: number;

  @ApiProperty({ example: '2026-11-03', description: 'Date in YYYY-MM-DD format' })
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ enum: SessionTimeSlot, example: SessionTimeSlot.SLOT_10_12 })
  @IsEnum(SessionTimeSlot)
  timeSlot: SessionTimeSlot;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  roomNumber: number;
}
