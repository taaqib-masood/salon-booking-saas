import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';

const logDir = 'logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// ── PII masking ───────────────────────────────────────────────────────────────
export function maskPhone(phone) {
  if (!phone) return '[no phone]';
  const s = String(phone);
  return s.length > 4 ? `****${s.slice(-4)}` : '****';
}

// ── Custom format ─────────────────────────────────────────────────────────────
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, module: mod, requestId, ...meta }) => {
    const tag    = mod ? `[${mod}]` : '';
    const rid    = requestId ? ` rid=${requestId}` : '';
    const extra  = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}${rid} ${tag} ${message}${extra}`;
  })
);

const rotateBase = {
  datePattern:    'YYYY-MM-DD',
  zippedArchive:  true,
  maxSize:        '20m',
  maxFiles:       '30d',
};

// ── Logger instance ───────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: jsonFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({ ...rotateBase, filename: `${logDir}/combined-%DATE%.log` }),
    new DailyRotateFile({ ...rotateBase, filename: `${logDir}/error-%DATE%.log`, level: 'error' }),
  ],
  // Don't crash if a transport fails
  exitOnError: false,
});

// morgan-compatible stream
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Factory — creates a child logger scoped to a module
export const createLogger = (module) => logger.child({ module });

export default logger;
