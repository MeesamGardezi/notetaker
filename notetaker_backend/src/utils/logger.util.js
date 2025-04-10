/**
 * Logger Utility
 * Custom logging with different levels and formatting
 */

const config = require('../config/app.config');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Current log level from config
const level = levels[config.logging.level] || levels.info;

/**
 * Check if the given level is enabled
 * @param {string} levelName - Log level name
 * @returns {boolean} - Whether the level is enabled
 */
const isLevelEnabled = (levelName) => {
  return levels[levelName] <= level;
};

/**
 * Format the log message
 * @param {string} levelName - Log level name
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} - Formatted log message
 */
const formatMessage = (levelName, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const levelColor = getLevelColor(levelName);
  
  let formattedMeta = '';
  if (Object.keys(meta).length > 0) {
    try {
      formattedMeta = JSON.stringify(meta);
    } catch (error) {
      formattedMeta = '[Circular]';
    }
  }
  
  return `${colors.dim}[${timestamp}]${colors.reset} ${levelColor}${levelName.toUpperCase()}${colors.reset}: ${message}${formattedMeta ? ` ${colors.dim}${formattedMeta}${colors.reset}` : ''}`;
};

/**
 * Get color for log level
 * @param {string} levelName - Log level name
 * @returns {string} - ANSI color code
 */
const getLevelColor = (levelName) => {
  switch (levelName) {
    case 'error':
      return colors.red;
    case 'warn':
      return colors.yellow;
    case 'info':
      return colors.green;
    case 'http':
      return colors.cyan;
    case 'debug':
      return colors.blue;
    default:
      return colors.white;
  }
};

/**
 * Log an error message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const error = (message, meta = {}) => {
  if (isLevelEnabled('error')) {
    console.error(formatMessage('error', message, meta));
  }
};

/**
 * Log a warning message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
  if (isLevelEnabled('warn')) {
    console.warn(formatMessage('warn', message, meta));
  }
};

/**
 * Log an info message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
  if (isLevelEnabled('info')) {
    console.info(formatMessage('info', message, meta));
  }
};

/**
 * Log an HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} time - Request processing time in ms
 */
const http = (req, res, time) => {
  if (isLevelEnabled('http')) {
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    
    const statusColor = getStatusColor(statusCode);
    const message = `${method} ${originalUrl} ${statusColor}${statusCode}${colors.reset} ${time}ms - ${ip}`;
    
    console.info(formatMessage('http', message));
  }
};

/**
 * Log a debug message
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
  if (isLevelEnabled('debug')) {
    console.debug(formatMessage('debug', message, meta));
  }
};

/**
 * Get color for HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} - ANSI color code
 */
const getStatusColor = (statusCode) => {
  if (statusCode < 300) {
    return colors.green;
  } else if (statusCode < 400) {
    return colors.cyan;
  } else if (statusCode < 500) {
    return colors.yellow;
  } else {
    return colors.red;
  }
};

/**
 * Log request and response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const time = Date.now() - start;
    http(req, res, time);
  });
  
  next();
};

module.exports = {
  error,
  warn,
  info,
  http,
  debug,
  logRequest
};