/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    details: err.details || null
  });

  // Determine if this is a known/operational error
  const isOperational = err.isOperational || false;
  
  // Default status code and message
  const statusCode = err.statusCode || 500;
  const message = isOperational 
    ? err.message 
    : 'An unexpected error occurred';

  // Format the error response
  const errorResponse = {
    error: message,
    status: statusCode
  };
  
  // Include error details if available and this is an operational error
  if (isOperational && err.details) {
    errorResponse.details = err.details;
  }
  
  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development' && !isOperational) {
    errorResponse.stack = err.stack;
  }

  // Send the error response
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  errorHandler,
  AppError
};