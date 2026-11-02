export interface TicketProps {
  id: number | null;
  userId: number;
  sessionId: number;
  watched: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export class Ticket {
  private constructor(private readonly props: TicketProps) {}

  static create(props: { userId: number; sessionId: number }): Ticket {
    return new Ticket({
      id: null,
      userId: props.userId,
      sessionId: props.sessionId,
      watched: false,
      createdAt: null,
      updatedAt: null,
    });
  }

  static restore(props: TicketProps): Ticket {
    return new Ticket({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get sessionId(): number {
    return this.props.sessionId;
  }

  get watched(): boolean {
    return this.props.watched;
  }

  get createdAt(): Date | null {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  markAsWatched(): void {
    this.props.watched = true;
  }
}
