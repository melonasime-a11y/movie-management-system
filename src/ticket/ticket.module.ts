import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { MovieModule } from '../movie/movie.module';
import { SessionModule } from '../session/session.module';
import { UserModule } from '../user/user.module';
import { BuyTicketUseCase } from './application/use-cases/buy-ticket.use-case';
import { GetUnusedTicketsUseCase } from './application/use-cases/get-unused-tickets.use-case';
import { GetWatchHistoryUseCase } from './application/use-cases/get-watch-history.use-case';
import { WatchMovieUseCase } from './application/use-cases/watch-movie.use-case';
import { TICKET_REPOSITORY } from './domain/repositories/ticket.repository';
import { TicketOrmEntity } from './infrastructure/persistence/ticket.orm-entity';
import { TypeOrmTicketRepository } from './infrastructure/repositories/typeorm-ticket.repository';
import { TicketController } from './presentation/controllers/ticket.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketOrmEntity]),
    AuthModule,
    UserModule,
    SessionModule,
    MovieModule,
  ],
  controllers: [TicketController],
  providers: [
    { provide: TICKET_REPOSITORY, useClass: TypeOrmTicketRepository },
    BuyTicketUseCase,
    WatchMovieUseCase,
    GetWatchHistoryUseCase,
    GetUnusedTicketsUseCase,
  ],
})
export class TicketModule {}
