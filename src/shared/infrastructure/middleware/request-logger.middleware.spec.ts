import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  it('logs method, url and timestamp without body or authorization', () => {
    const middleware = new RequestLoggerMiddleware();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const next: NextFunction = jest.fn();

    const req = {
      method: 'POST',
      originalUrl: '/auth/login',
      headers: { authorization: 'Bearer secret-token' },
      body: { username: 'alice', password: 'secret123' },
    } as unknown as Request;

    middleware.use(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(1);

    const message = logSpy.mock.calls[0][0] as string;
    expect(message).toContain('POST /auth/login');
    expect(message).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(message).not.toContain('secret-token');
    expect(message).not.toContain('secret123');
    expect(message).not.toContain('password');
    expect(message).not.toContain('authorization');

    logSpy.mockRestore();
  });
});
