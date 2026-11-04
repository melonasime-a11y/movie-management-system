import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';

function isolatedDatabasePath(): string {
  const databasePath = process.env.DATABASE_URL;

  if (!databasePath || resolve(databasePath) === resolve('database.sqlite')) {
    throw new Error(
      'E2E tests must run against an isolated DATABASE_URL (see test/setup-e2e-env.ts)',
    );
  }

  return databasePath;
}

export async function createE2eApp(): Promise<INestApplication<App>> {
  const databasePath = isolatedDatabasePath();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleRef.createNestApplication({
    logger: ['error', 'warn'],
  });

  // Mirrors the global pipe registered in src/main.ts.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const connectedDatabase = app.get(DataSource).options.database;
  if (connectedDatabase !== databasePath) {
    await app.close();
    throw new Error(
      `E2E app connected to "${String(connectedDatabase)}" instead of the isolated test database`,
    );
  }

  return app;
}

export async function closeE2eApp(app: INestApplication | undefined): Promise<void> {
  await app?.close();

  const databasePath = isolatedDatabasePath();
  rmSync(databasePath, { force: true });
  rmSync(`${databasePath}-journal`, { force: true });
}
