import { Body, Controller, Post } from '@nestjs/common';

import { LoginDto } from '../../application/dto/login.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
  ) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.registerUser.execute(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.loginUser.execute(loginDto);
  }
}
