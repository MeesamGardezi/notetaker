/**
 * Response Utility
 * Standardized API response formats
 */

/**
 * Create a success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Express response
 */
const successResponse = (res, message = 'Success', data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  /**
   * Create an error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Object} errors - Error details
   * @param {number} statusCode - HTTP status code
   * @returns {Object} - Express response
   */
  const errorResponse = (res, message = 'Error', errors = null, statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  };
  
  /**
   * Create a paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Response data array
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total items count
   * @param {string} message - Success message
   * @returns {Object} - Express response
   */
  const paginatedResponse = (res, data, page = 1, limit = 10, total = 0, message = 'Success') => {
    const totalPages = Math.ceil(total / limit) || 1;
    
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  };
  
  /**
   * Create a validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   * @returns {Object} - Express response
   */
  const validationErrorResponse = (res, errors) => {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  };
  
  /**
   * Create a not found response
   * @param {Object} res - Express response object
   * @param {string} item - Item that was not found
   * @returns {Object} - Express response
   */
  const notFoundResponse = (res, item = 'Resource') => {
    return res.status(404).json({
      success: false,
      message: `${item} not found`
    });
  };
  
  /**
   * Create an unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} - Express response
   */
  const unauthorizedResponse = (res, message = 'Unauthorized access') => {
    return res.status(401).json({
      success: false,
      message
    });
  };
  
  /**
   * Create a forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} - Express response
   */
  const forbiddenResponse = (res, message = 'Forbidden access') => {
    return res.status(403).json({
      success: false,
      message
    });
  };
  
  module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
    validationErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse
  };