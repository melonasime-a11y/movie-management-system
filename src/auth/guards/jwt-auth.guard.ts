import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';

  import { getJwtSecret } from '../../shared/infrastructure/config/jwt-secret';
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
  
      const authHeader = request.headers.authorization;
  
      if (!authHeader) {
        throw new UnauthorizedException('Missing authorization token');
      }
  
      const [type, token] = authHeader.split(' ');
  
      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException('Invalid authorization header');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: getJwtSecret(),
        });
  
        request.user = payload;
  
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }