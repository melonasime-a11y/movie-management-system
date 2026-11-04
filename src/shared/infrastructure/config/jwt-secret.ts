const DEVELOPMENT_JWT_SECRET = 'development-secret';

// Placeholder values that must never sign production tokens (see .env.example).
const INSECURE_SECRETS = new Set([
  DEVELOPMENT_JWT_SECRET,
  'replace-with-a-long-random-secret',
]);

// Read lazily (not at import time) so values loaded from .env by ConfigModule are seen.
export function getJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim();

  if (env.NODE_ENV === 'production') {
    if (!secret || INSECURE_SECRETS.has(secret)) {
      throw new Error(
        'JWT_SECRET must be set to a strong, non-placeholder value when NODE_ENV=production',
      );
    }
    return secret;
  }

  return secret || DEVELOPMENT_JWT_SECRET;
}
