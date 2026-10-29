import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Delete,
  } from '@nestjs/common';
  
  import { MovieService } from './movie.service';
  import { CreateMovieDto } from './dto/create-movie.dto';
  import { UpdateMovieDto } from './dto/update-movie.dto';
  
  @Controller('movie')
  export class MovieController {
    constructor(private readonly movieService: MovieService) {}
  
    @Get()
    findAll() {
      return this.movieService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.findOne(id);
    }
  
    @Post()
    create(@Body() createMovieDto: CreateMovieDto) {
      return this.movieService.create(createMovieDto);
    }
  
    @Patch(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateMovieDto: UpdateMovieDto,
    ) {
      return this.movieService.update(id, updateMovieDto);
    }
    @Delete(':id')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.movieService.remove(id);
}
  }