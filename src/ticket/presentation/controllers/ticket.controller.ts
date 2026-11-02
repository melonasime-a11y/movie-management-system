import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { BuyTicketDto } from '../../application/dto/buy-ticket.dto';
import { BuyTicketUseCase } from '../../application/use-cases/buy-ticket.use-case';
import { GetUnusedTicketsUseCase } from '../../application/use-cases/get-unused-tickets.use-case';
import { GetWatchHistoryUseCase } from '../../application/use-cases/get-watch-history.use-case';
import { WatchMovieUseCase } from '../../application/use-cases/watch-movie.use-case';

type AuthenticatedRequest = {
  user: {
    sub: number;
  };
};

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class TicketController {
  constructor(
    private readonly buyTicket: BuyTicketUseCase,
    private readonly watchMovie: WatchMovieUseCase,
    private readonly getWatchHistory: GetWatchHistoryUseCase,
    private readonly getUnusedTickets: GetUnusedTicketsUseCase,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() buyTicketDto: BuyTicketDto,
  ) {
    return this.buyTicket.execute(request.user.sub, buyTicketDto);
  }

  @Get('history')
  history(@Req() request: AuthenticatedRequest) {
    return this.getWatchHistory.execute(request.user.sub);
  }

  @Get('unused')
  unused(@Req() request: AuthenticatedRequest) {
    return this.getUnusedTickets.execute(request.user.sub);
  }

  @Post(':id/watch')
  watch(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.watchMovie.execute(request.user.sub, id);
  }
}
