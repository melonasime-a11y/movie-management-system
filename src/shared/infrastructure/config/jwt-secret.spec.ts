import { getJwtSecret } from './jwt-secret';

describe('getJwtSecret', () => {
  it('returns the configured secret', () => {
    expect(getJwtSecret({ JWT_SECRET: 'a-real-secret' })).toBe('a-real-secret');
  });

  it('falls back to the development secret outside production', () => {
    expect(getJwtSecret({})).toBe('development-secret');
    expect(getJwtSecret({ NODE_ENV: 'test', JWT_SECRET: '   ' })).toBe('development-secret');
  });

  it('uses the configured secret in production', () => {
    expect(
      getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'a-strong-production-secret' }),
    ).toBe('a-strong-production-secret');
  });

  it.each([
    ['missing', undefined],
    ['blank', '  '],
    ['the development fallback', 'development-secret'],
    ['the .env.example placeholder', 'replace-with-a-long-random-secret'],
  ])('refuses to run in production when JWT_SECRET is %s', (_label, value) => {
    expect(() => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: value })).toThrow(
      /JWT_SECRET must be set/,
    );
  });
});
