import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';

import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';

export class UpdateSessionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  movieId?: number;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @IsEnum(SessionTimeSlot)
  timeSlot?: SessionTimeSlot;

  @IsOptional()
  @IsInt()
  @Min(1)
  roomNumber?: number;
}
