import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { MovieModule } from '../movie/movie.module';
import { CreateSessionUseCase } from './application/use-cases/create-session.use-case';
import { DeleteSessionUseCase } from './application/use-cases/delete-session.use-case';
import { GetSessionByIdUseCase } from './application/use-cases/get-session-by-id.use-case';
import { GetSessionsUseCase } from './application/use-cases/get-sessions.use-case';
import { UpdateSessionUseCase } from './application/use-cases/update-session.use-case';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { SessionOrmEntity } from './infrastructure/persistence/session.orm-entity';
import { TypeOrmSessionRepository } from './infrastructure/repositories/typeorm-session.repository';
import { SessionController } from './presentation/controllers/session.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionOrmEntity]),
    AuthModule,
    MovieModule,
  ],
  controllers: [SessionController],
  providers: [
    { provide: SESSION_REPOSITORY, useClass: TypeOrmSessionRepository },
    CreateSessionUseCase,
    GetSessionsUseCase,
    GetSessionByIdUseCase,
    UpdateSessionUseCase,
    DeleteSessionUseCase,
  ],
})
export class SessionModule {}
