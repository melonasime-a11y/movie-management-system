import { Controller, Get, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

@Controller()
class SwaggerProbeController {
  @Get('health')
  health() {
    return { ok: true };
  }
}

describe('Swagger bootstrap', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SwaggerProbeController],
    }).compile();

    app = moduleRef.createNestApplication();

    const config = new DocumentBuilder()
      .setTitle('Movie Management System API')
      .setDescription('NestJS DDD Movie Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves Swagger UI at /docs without breaking the app', async () => {
    await request(app.getHttpServer()).get('/docs').expect(200);
    await request(app.getHttpServer()).get('/health').expect(200, { ok: true });
  });
});
