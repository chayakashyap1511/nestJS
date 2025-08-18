import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/config.service";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Ensures logs aren't lost during startup
  });

  const configService = app.get(AppConfigService);

  app.enableCors({
    origin: configService.corsOrigin,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  // Optional: global prefix for versioning (e.g., /api/v1)
  // app.setGlobalPrefix('api');

  app.use("/razorpay/webhook", bodyParser.raw({ type: "application/json" }));

  const port = configService.port;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();