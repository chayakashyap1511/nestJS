import { Injectable, LoggerService, LogLevel } from "@nestjs/common";
import * as winston from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
    razorpay: 7, // 👈 Custom log level
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    verbose: "cyan",
    debug: "blue",
    silly: "gray",
    razorpay: "cyan", // 👈 Custom color (optional for console)
  },
};

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      levels: customLevels.levels,
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
      ),
      transports: [
        new DailyRotateFile({
          dirname: "logs", // folder
          filename: "application-%DATE%.log",
          datePattern: "YYYY-MM-DD", // or 'YYYY-ww' for weekly rotation
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
        }),
        new DailyRotateFile({
          dirname: "logs/razorpay",
          filename: "razorpay-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "10m",
          maxFiles: "30d",
          level: "razorpay",
          format: winston.format.combine(
            winston.format((info) => {
              return info.level === "razorpay" ? info : false;
            })(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => {
              return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
            })
          ),
        }),
        new winston.transports.Console(), // optional: also log to console
      ],
      exceptionHandlers: [
        new DailyRotateFile({
          dirname: "logs",
          filename: "exceptions-%DATE%.log",
          datePattern: "YYYY-ww",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "30d",
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          dirname: "logs",
          filename: "rejections-%DATE%.log",
          datePattern: "YYYY-ww",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "30d",
        }),
      ],
    });

    winston.addColors(customLevels.colors);
  }

  logRazorpay(message: string) {
    this.logger.log({
      level: "razorpay",
      message: `[RAZORPAY] ${message}`,
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(`${message} -> ${trace}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
