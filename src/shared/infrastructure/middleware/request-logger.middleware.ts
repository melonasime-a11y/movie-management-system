import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, _res: Response, next: NextFunction): void {
    this.logger.log(
      `${req.method} ${req.originalUrl} ${new Date().toISOString()}`,
    );
    next();
  }
}
