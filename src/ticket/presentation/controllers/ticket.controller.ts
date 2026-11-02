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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { BuyTicketDto } from '../../application/dto/buy-ticket.dto';
import { TicketResponseDto } from '../../application/dto/ticket-response.dto';
import { BuyTicketUseCase } from '../../application/use-cases/buy-ticket.use-case';
import { GetUnusedTicketsUseCase } from '../../application/use-cases/get-unused-tickets.use-case';
import { GetWatchHistoryUseCase } from '../../application/use-cases/get-watch-history.use-case';
import { WatchMovieUseCase } from '../../application/use-cases/watch-movie.use-case';

type AuthenticatedRequest = {
  user: {
    sub: number;
  };
};

@ApiTags('tickets')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Buy a ticket for a session (customer only)' })
  @ApiResponse({ status: 201, type: TicketResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or age restriction' })
  @ApiResponse({ status: 404, description: 'Session, movie, or user not found' })
  @ApiResponse({ status: 409, description: 'Ticket already exists' })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() buyTicketDto: BuyTicketDto,
  ) {
    return this.buyTicket.execute(request.user.sub, buyTicketDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get watched tickets for the authenticated customer' })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  history(@Req() request: AuthenticatedRequest) {
    return this.getWatchHistory.execute(request.user.sub);
  }

  @Get('unused')
  @ApiOperation({
    summary: 'Get unused tickets for the authenticated customer',
  })
  @ApiResponse({ status: 200, type: [TicketResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  unused(@Req() request: AuthenticatedRequest) {
    return this.getUnusedTickets.execute(request.user.sub);
  }

  @Post(':id/watch')
  @ApiOperation({ summary: 'Watch a movie using an owned ticket' })
  @ApiResponse({ status: 201, type: TicketResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or ticket not owned' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 409, description: 'Ticket already watched' })
  watch(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.watchMovie.execute(request.user.sub, id);
  }
}
