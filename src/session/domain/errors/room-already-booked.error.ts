import { ConflictError } from '../../../shared/domain/errors';

export class RoomAlreadyBookedError extends ConflictError {
  constructor() {
    super('Room is already booked for this date and time slot');
  }
}
