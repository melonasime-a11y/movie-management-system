import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { ResponseTimeInterceptor } from './response-time.interceptor';

describe('ResponseTimeInterceptor', () => {
  const interceptor = new ResponseTimeInterceptor();

  function createContext(setHeader: jest.Mock): ExecutionContext {
    return {
      switchToHttp: () => ({
        getResponse: () => ({ setHeader }),
      }),
    } as unknown as ExecutionContext;
  }

  it('adds X-Response-Time and preserves the original body', (done) => {
    const setHeader = jest.fn();
    const body = { ok: true };
    const next: CallHandler = { handle: () => of(body) };

    interceptor.intercept(createContext(setHeader), next).subscribe({
      next: (value) => {
        expect(value).toEqual(body);
        expect(setHeader).toHaveBeenCalledWith(
          'X-Response-Time',
          expect.stringMatching(/^\d+ms$/),
        );
        done();
      },
      error: done,
    });
  });

  it('still sets X-Response-Time when the handler errors', (done) => {
    const setHeader = jest.fn();
    const next: CallHandler = {
      handle: () => throwError(() => new Error('boom')),
    };

    interceptor.intercept(createContext(setHeader), next).subscribe({
      next: () => done(new Error('expected error')),
      error: () => {
        expect(setHeader).toHaveBeenCalledWith(
          'X-Response-Time',
          expect.stringMatching(/^\d+ms$/),
        );
        done();
      },
    });
  });
});
