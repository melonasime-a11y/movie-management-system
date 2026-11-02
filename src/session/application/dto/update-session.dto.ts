import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  movieId?: number;

  @ApiPropertyOptional({
    example: '2026-11-03',
    description: 'Date in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiPropertyOptional({
    enum: SessionTimeSlot,
    example: SessionTimeSlot.SLOT_12_14,
  })
  @IsOptional()
  @IsEnum(SessionTimeSlot)
  timeSlot?: SessionTimeSlot;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  roomNumber?: number;
}
