import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { SessionTimeSlot } from '../../domain/entities/session-time-slot.enum';

@Entity('sessions')
@Unique(['roomNumber', 'date', 'timeSlot'])
export class SessionOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movieId: number;

  @Column({ type: 'text' })
  date: string;

  @Column({ type: 'text' })
  timeSlot: SessionTimeSlot;

  @Column()
  roomNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
