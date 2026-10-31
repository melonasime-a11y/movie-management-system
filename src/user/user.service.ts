import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByUsername(createUserDto.username);
  
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
  
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  
    return this.userRepository.save(user);
  }
}