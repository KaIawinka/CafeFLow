/**
 * Centralized logging utility
 * Replaces console.log/warn/error with structured logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    }[level];

    let output = `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }

    return output;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : error,
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
