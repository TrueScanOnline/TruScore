// Centralized logging utility with log levels
// Strips debug logs in production builds

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
const currentLogLevel: LogLevel = isDevelopment ? 'DEBUG' : 'WARN';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
  }

  private sanitizeData(data: unknown): unknown {
    // Remove sensitive data from logs
    if (typeof data === 'string') {
      // Remove potential API keys
      return data.replace(/(api[_-]?key|token|secret|password)=[^\s&]+/gi, '$1=***');
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = { ...data as Record<string, unknown> };
      const sensitiveKeys = ['apiKey', 'token', 'secret', 'password', 'mnemonic', 'privateKey'];
      sensitiveKeys.forEach(key => {
        if (key in sanitized) {
          sanitized[key] = '***';
        }
      });
      return sanitized;
    }
    return data;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('DEBUG')) {
      console.log(`[DEBUG] ${message}`, ...args.map(arg => this.sanitizeData(arg)));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('INFO')) {
      console.log(`[INFO] ${message}`, ...args.map(arg => this.sanitizeData(arg)));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('WARN')) {
      console.warn(`[WARN] ${message}`, ...args.map(arg => this.sanitizeData(arg)));
    }
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog('ERROR')) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(`[ERROR] ${message}`, errorData, ...args.map(arg => this.sanitizeData(arg)));
    }
  }
}

export const logger = new Logger();

