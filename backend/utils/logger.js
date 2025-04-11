/**
 * Logger Utility
 * Centralized logging functionality
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Register colors with winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define log transports
const transports = [
  // Console transport for all logs
  new winston.transports.Console(),
  
  // File transport for error logs
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error'
  }),
  
  // File transport for all logs
  new winston.transports.File({ 
    filename: path.join('logs', 'combined.log')
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

// Custom formatting for objects and errors
const formatMessage = (message) => {
  if (message instanceof Error) {
    return message.stack || message.toString();
  }
  if (typeof message === 'object') {
    return JSON.stringify(message, null, 2);
  }
  return message;
};

// Export a modified logger with better handling of objects and errors
module.exports = {
  error: (message, meta = {}) => {
    logger.error(formatMessage(message), meta);
  },
  warn: (message, meta = {}) => {
    logger.warn(formatMessage(message), meta);
  },
  info: (message, meta = {}) => {
    logger.info(formatMessage(message), meta);
  },
  http: (message, meta = {}) => {
    logger.http(formatMessage(message), meta);
  },
  debug: (message, meta = {}) => {
    logger.debug(formatMessage(message), meta);
  }
};