import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MovieModule } from './movie/movie.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { TicketModule } from './ticket/ticket.module';
import { RequestLoggerMiddleware } from './shared/infrastructure/middleware/request-logger.middleware';
import { DomainErrorFilter } from './shared/presentation/filters/domain-error.filter';
import { ResponseTimeInterceptor } from './shared/presentation/interceptors/response-time.interceptor';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_URL || 'database.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),

    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'movie-management-system',
    }),

    MovieModule,

    UserModule,

    AuthModule,

    SessionModule,

    TicketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseTimeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('{*path}');
  }
}
