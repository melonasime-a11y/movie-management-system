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
import { CreateMovieDto } from '../../application/dto/create-movie.dto';
import { MovieResponseDto } from '../../application/dto/movie-response.dto';
import { UpdateMovieDto } from '../../application/dto/update-movie.dto';
import { CreateMovieUseCase } from '../../application/use-cases/create-movie.use-case';
import { DeleteMovieUseCase } from '../../application/use-cases/delete-movie.use-case';
import { GetMovieByIdUseCase } from '../../application/use-cases/get-movie-by-id.use-case';
import { GetMoviesUseCase } from '../../application/use-cases/get-movies.use-case';
import { UpdateMovieUseCase } from '../../application/use-cases/update-movie.use-case';

@ApiTags('movies')
@ApiBearerAuth()
@Controller('movie')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovieController {
  constructor(
    private readonly createMovie: CreateMovieUseCase,
    private readonly getMovies: GetMoviesUseCase,
    private readonly getMovieById: GetMovieByIdUseCase,
    private readonly updateMovie: UpdateMovieUseCase,
    private readonly deleteMovie: DeleteMovieUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all movies' })
  @ApiResponse({ status: 200, type: [MovieResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.getMovies.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie by id' })
  @ApiResponse({ status: 200, type: MovieResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getMovieById.execute(id);
  }

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a movie (manager only)' })
  @ApiResponse({ status: 201, type: MovieResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Movie name already exists' })
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.createMovie.execute(createMovieDto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a movie (manager only)' })
  @ApiResponse({ status: 200, type: MovieResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 409, description: 'Movie name already exists' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.updateMovie.execute(id, updateMovieDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a movie (manager only)' })
  @ApiResponse({ status: 200, type: MovieResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteMovie.execute(id);
  }
}
