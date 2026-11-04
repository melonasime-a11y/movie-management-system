import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// AppModule reads DATABASE_URL when it is first imported, so this must run before any spec file loads.
process.env.DATABASE_URL = join(
  tmpdir(),
  `movie-management-e2e-${process.pid}-${randomUUID()}.sqlite`,
);
