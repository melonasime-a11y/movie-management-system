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
import { CreateSessionDto } from '../../application/dto/create-session.dto';
import { SessionResponseDto } from '../../application/dto/session-response.dto';
import { UpdateSessionDto } from '../../application/dto/update-session.dto';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { DeleteSessionUseCase } from '../../application/use-cases/delete-session.use-case';
import { GetSessionByIdUseCase } from '../../application/use-cases/get-session-by-id.use-case';
import { GetSessionsUseCase } from '../../application/use-cases/get-sessions.use-case';
import { UpdateSessionUseCase } from '../../application/use-cases/update-session.use-case';

@ApiTags('sessions')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'List all sessions' })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.getSessions.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by id' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getSessionById.execute(id);
  }

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a session (manager only)' })
  @ApiResponse({ status: 201, type: SessionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 409, description: 'Room already booked' })
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.createSession.execute(createSessionDto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a session (manager only)' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Session or movie not found' })
  @ApiResponse({ status: 409, description: 'Room already booked' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return this.updateSession.execute(id, updateSessionDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a session (manager only)' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteSession.execute(id);
  }
}
