import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { getJwtSecret } from '../shared/infrastructure/config/jwt-secret';
import { UserModule } from '../user/user.module';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [RegisterUserUseCase, LoginUserUseCase, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
