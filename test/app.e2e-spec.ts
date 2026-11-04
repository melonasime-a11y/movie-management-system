import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

import { api } from './utils/api';
import { closeE2eApp, createE2eApp } from './utils/e2e-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('/ (GET)', () => {
    return api(app).get('/').expect(200).expect('Hello World!');
  });
});
