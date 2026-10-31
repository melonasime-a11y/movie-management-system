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
import { CreateMovieDto } from '../../application/dto/create-movie.dto';
import { UpdateMovieDto } from '../../application/dto/update-movie.dto';
import { CreateMovieUseCase } from '../../application/use-cases/create-movie.use-case';
import { DeleteMovieUseCase } from '../../application/use-cases/delete-movie.use-case';
import { GetMovieByIdUseCase } from '../../application/use-cases/get-movie-by-id.use-case';
import { GetMoviesUseCase } from '../../application/use-cases/get-movies.use-case';
import { UpdateMovieUseCase } from '../../application/use-cases/update-movie.use-case';

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
  findAll() {
    return this.getMovies.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getMovieById.execute(id);
  }

  @Post()
  @Roles(UserRole.MANAGER)
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.createMovie.execute(createMovieDto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.updateMovie.execute(id, updateMovieDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteMovie.execute(id);
  }
}
