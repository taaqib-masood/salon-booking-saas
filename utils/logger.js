```javascript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { format } from 'logform';
import morgan from 'morgan';
import fs from 'fs';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: `${logDir}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

const createLogger = (module) => {
  return logger.child({ module });
};

logger.stream = {
  write: function(message, encoding){
    logger.info(message);
  }
};

export const addRequestContext = (req) => {
  const tenantId = req.headers['x-tenantid'];
  const userId = req.user ? req.user._id : null;
  const requestId = req.requestId || 'unknown';
  
  return { tenantId, userId, requestId };
};

export default logger;
export { createLogger };
```