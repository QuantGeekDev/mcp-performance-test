import chalk from "chalk";
import { Logger, LogLevel } from "./types.js";

const LOG_LEVELS: Record<LogLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export class ConfigurableLogger implements Logger {
  private logLevel: LogLevel;
  private enableColors: boolean;
  private customLogger: Logger | undefined;

  constructor(
    logLevel: LogLevel = "info",
    enableColors: boolean = true,
    customLogger?: Logger
  ) {
    this.logLevel = logLevel;
    this.enableColors = enableColors;
    this.customLogger = customLogger;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel];
  }

  private formatMessage(level: string, message: string): string {
    if (!this.enableColors) {
      return `[${level.toUpperCase()}] ${message}`;
    }

    switch (level) {
      case "error":
        return chalk.red(`[ERROR] ${message}`);
      case "warn":
        return chalk.yellow(`[WARN] ${message}`);
      case "info":
        return chalk.blue(`[INFO] ${message}`);
      case "debug":
        return chalk.gray(`[DEBUG] ${message}`);
      default:
        return `[${level.toUpperCase()}] ${message}`;
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.customLogger) {
      this.customLogger.error(message, ...args);
      return;
    }
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.customLogger) {
      this.customLogger.warn(message, ...args);
      return;
    }
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.customLogger) {
      this.customLogger.info(message, ...args);
      return;
    }
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.customLogger) {
      this.customLogger.debug(message, ...args);
      return;
    }
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message), ...args);
    }
  }
}

export const defaultLogger = new ConfigurableLogger();
