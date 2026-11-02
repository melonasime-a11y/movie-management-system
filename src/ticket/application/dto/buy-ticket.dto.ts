import { IsInt, Min } from 'class-validator';

export class BuyTicketDto {
  @IsInt()
  @Min(1)
  sessionId: number;
}
