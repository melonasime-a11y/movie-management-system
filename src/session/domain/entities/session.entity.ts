import { SessionTimeSlot } from './session-time-slot.enum';

export interface SessionProps {
  id: number | null;
  movieId: number;
  date: string;
  timeSlot: SessionTimeSlot;
  roomNumber: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SessionChanges {
  movieId?: number;
  date?: string;
  timeSlot?: SessionTimeSlot;
  roomNumber?: number;
}

export class Session {
  private constructor(private readonly props: SessionProps) {}

  static create(props: {
    movieId: number;
    date: string;
    timeSlot: SessionTimeSlot;
    roomNumber: number;
  }): Session {
    return new Session({
      id: null,
      movieId: props.movieId,
      date: props.date,
      timeSlot: props.timeSlot,
      roomNumber: props.roomNumber,
      createdAt: null,
      updatedAt: null,
    });
  }

  static restore(props: SessionProps): Session {
    return new Session({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get movieId(): number {
    return this.props.movieId;
  }

  get date(): string {
    return this.props.date;
  }

  get timeSlot(): SessionTimeSlot {
    return this.props.timeSlot;
  }

  get roomNumber(): number {
    return this.props.roomNumber;
  }

  get createdAt(): Date | null {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  update(changes: SessionChanges): void {
    if (changes.movieId !== undefined) {
      this.props.movieId = changes.movieId;
    }
    if (changes.date !== undefined) {
      this.props.date = changes.date;
    }
    if (changes.timeSlot !== undefined) {
      this.props.timeSlot = changes.timeSlot;
    }
    if (changes.roomNumber !== undefined) {
      this.props.roomNumber = changes.roomNumber;
    }
  }
}
