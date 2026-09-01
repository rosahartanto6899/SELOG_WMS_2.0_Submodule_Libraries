import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, json } = format;

const winstonLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json(),
  ),
  transports: [new transports.Console()],
});

const logger = {
  info: (message: string | object): void => {
    winstonLogger.info(message);
  },
  warn: (message: string | object): void => {
    winstonLogger.warn(message);
  },
  error: (error: unknown | object): void => {
    if (error instanceof Error) {
      winstonLogger.error(error.message, { stack: error.stack });
    } else {
      winstonLogger.error(error);
    }
  },
  debug: (message: string | object): void => {
    winstonLogger.debug(message);
  },
};

export default logger;
