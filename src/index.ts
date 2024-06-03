import * as fs from "fs";
import * as path from "path";

type LogLevel = "info" | "warn" | "error" | "debug";

class Transport {
  private logFilePath: string | null;
  private logToConsole: boolean;

  constructor(
    logFilePath: string | null = null,
    logToConsole: boolean = false
  ) {
    this.logFilePath = logFilePath;
    this.logToConsole = logToConsole;
  }

  private async writeToFile(message: string) {
    if (this.logFilePath) {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        await fs.promises.mkdir(logDir, { recursive: true });
      }

      await fs.promises.appendFile(this.logFilePath, message + "\n", "utf8");
    }
  }

  private colorize(level: LogLevel, message: string): string {
    let color = "1";

    switch (level) {
      case "info":
        color = "31";
        break;
      case "warn":
        color = "33";
        break;
      case "error":
        color = "32";
        break;
      case "debug":
        color = "34";
        break;
      default:
        return message;
    }
    return `\x1B[${color}m${message}\x1B`;
  }

  public async log(level: LogLevel, message: string) {
    const coloredMessage = this.colorize(level, message);

    if (this.logToConsole) {
      console.log(coloredMessage, "hijn");
    }

    if (this.logFilePath) {
      await this.writeToFile(coloredMessage); // Write colored message to file
    }
  }
}

class Logger {
  private transport: Transport;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  private currentLevel: LogLevel;

  constructor(transport: Transport, level: LogLevel = "info") {
    this.transport = transport;
    this.currentLevel = level;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.currentLevel];
  }

  private async writeLog(level: LogLevel, message: string) {
    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(level, message);
      await this.transport.log(level, formattedMessage);
    }
  }

  public async debug(message: string) {
    await this.writeLog("debug", message);
  }

  public async info(message: string) {
    await this.writeLog("info", message);
  }

  public async warn(message: string) {
    await this.writeLog("warn", message);
  }

  public async error(message: string) {
    await this.writeLog("error", message);
  }
}

const fileTransport = new Transport(
  path.join(__dirname, "logs", "app.log"),
  false
);
const consoleTransport = new Transport(null, true);

const fileLogger = new Logger(fileTransport, "debug");
const consoleLogger = new Logger(consoleTransport, "debug");

(async () => {
  await fileLogger.info("This is an info message.");
  await fileLogger.warn("This is a warning message.");
  await fileLogger.error("This is an error message.");
  await fileLogger.debug("This is a debug message.");
})();

export { Logger, Transport };
