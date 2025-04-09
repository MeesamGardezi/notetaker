/**
 * Error Middleware
 * Handles error responses for the API
 */

/**
 * Central error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
    // Default error status and message
    let status = 500;
    let message = 'Internal server error';
    
    // Log the error for debugging
    console.error('Error:', err);
    
    // Check if error is a known type
    if (err.name === 'ValidationError') {
      status = 400;
      message = err.message;
    } else if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
      status = 401;
      message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError' || err.message.includes('limit reached')) {
      status = 403;
      message = err.message;
    } else if (err.name === 'NotFoundError' || err.message.includes('not found')) {
      status = 404;
      message = err.message;
    }
    
    // Handle Firebase specific errors
    if (err.code) {
      if (err.code.startsWith('auth/')) {
        status = 401;
        message = err.message;
      } else if (err.code === 'permission-denied') {
        status = 403;
        message = 'Permission denied';
      } else if (err.code === 'not-found') {
        status = 404;
        message = 'Resource not found';
      }
    }
    
    // Send error response
    res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  };
  
  /**
   * 404 Not Found handler
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  const notFound = (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`
    });
  };
  
  /**
   * Method not allowed handler
   * @param {string[]} allowedMethods - Array of allowed HTTP methods
   * @returns {Function} - Express middleware function
   */
  const methodNotAllowed = (allowedMethods) => {
    return (req, res) => {
      res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`,
        allowed: allowedMethods
      });
    };
  };
  
  module.exports = {
    errorHandler,
    notFound,
    methodNotAllowed
  };