import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private logFilePath: string;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  private currentLevel: LogLevel;

  constructor(logFilePath: string, level: LogLevel = 'info') {
    this.logFilePath = logFilePath;
    this.currentLevel = level;
    this.ensureLogFileExists();
  }

  private ensureLogFileExists() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, '', { flag: 'a' });
    }
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
      try {
        await fs.promises.appendFile(this.logFilePath, formattedMessage + '\n', 'utf8');
      } catch (error) {
        console.error(`Failed to write log: ${error}`);
      }
    }
  }

  public async debug(message: string) {
    await this.writeLog('debug', message);
  }

  public async info(message: string) {
    await this.writeLog('info', message);
  }

  public async warn(message: string) {
    await this.writeLog('warn', message);
  }

  public async error(message: string) {
    await this.writeLog('error', message);
  }
}

(async () => {
    const logger = new Logger(path.join(__dirname, 'logs', 'app.log'), 'debug');
    await logger.info('This is an info message.');
    await logger.warn('This is a warning message.');
    await logger.error('This is an error message.');
    await logger.debug('This is a debug message.');
  })();
  
  