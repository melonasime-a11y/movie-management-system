import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../../user/domain/entities/user-role.enum';
import { CreateSessionDto } from '../../application/dto/create-session.dto';
import { UpdateSessionDto } from '../../application/dto/update-session.dto';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { DeleteSessionUseCase } from '../../application/use-cases/delete-session.use-case';
import { GetSessionByIdUseCase } from '../../application/use-cases/get-session-by-id.use-case';
import { GetSessionsUseCase } from '../../application/use-cases/get-sessions.use-case';
import { UpdateSessionUseCase } from '../../application/use-cases/update-session.use-case';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionController {
  constructor(
    private readonly createSession: CreateSessionUseCase,
    private readonly getSessions: GetSessionsUseCase,
    private readonly getSessionById: GetSessionByIdUseCase,
    private readonly updateSession: UpdateSessionUseCase,
    private readonly deleteSession: DeleteSessionUseCase,
  ) {}

  @Get()
  findAll() {
    return this.getSessions.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getSessionById.execute(id);
  }

  @Post()
  @Roles(UserRole.MANAGER)
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.createSession.execute(createSessionDto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return this.updateSession.execute(id, updateSessionDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteSession.execute(id);
  }
}
