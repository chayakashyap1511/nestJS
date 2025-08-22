import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";

import { AppController } from "./app.controller";

import { AppService } from "./app.service";
import { WinstonLoggerService } from "./common/winston-logger/winston-logger.service";
import { LoggerMiddleware } from "./common/middlewares/logger.middleware";

import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

import helmet from "helmet";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { BlacklistModule } from "./blacklist/blacklist.module";
import { GoogleStrategy } from "./auth/google.strategy";
import { FacebookStrategy } from "./auth/facebook.strategy";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    ConfigModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "uploads"),
      serveRoot: "/uploads",
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, //60 seconds
        limit: 30,
      },
    ]),
    AuthModule,
    UsersModule,
    PrismaModule,
    BlacklistModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WinstonLoggerService,
    GoogleStrategy,
    FacebookStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // ✅ Global guard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
    // consumer.apply(helmet()).forRoutes("*"); // Apply to all routes
    consumer
      .apply(
        helmet({
          crossOriginResourcePolicy: { policy: "cross-origin" },
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:", "http:"],
              styleSrc: ["'self'", "https:", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              fontSrc: ["'self'", "https:", "data:"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          },
        })
      )
      .forRoutes("*");
  }
}
