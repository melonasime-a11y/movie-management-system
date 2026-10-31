import {
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  
  import { UserService } from '../user/user.service';
  import { UserRole } from '../user/entities/user.entity';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly userService: UserService,
      private readonly jwtService: JwtService,
    ) {}
  
    async register(registerDto: RegisterDto) {
      const user = await this.userService.create({
        ...registerDto,
        role: UserRole.CUSTOMER,
      });
  
      const { password, ...safeUser } = user;
  
      return safeUser;
    }
  
    async login(loginDto: LoginDto) {
      const user = await this.userService.findByUsername(loginDto.username);
  
      if (!user) {
        throw new UnauthorizedException('Invalid username or password');
      }
  
      const passwordMatches = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
  
      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid username or password');
      }
  
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };
  
      return {
        accessToken: await this.jwtService.signAsync(payload),
      };
    }
  }