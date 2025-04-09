/**
 * Validators
 * Utility functions for data validation
 */

const { body, validationResult } = require('express-validator');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with errors if any
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate hex color code
 * @param {string} color - Color code to validate
 * @returns {boolean} - Whether color is valid
 */
const isValidHexColor = (color) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Validate file extension against allowed types
 * @param {string} filename - Filename to validate
 * @param {string[]} allowedExtensions - Array of allowed extensions
 * @returns {boolean} - Whether file extension is valid
 */
const isValidFileExtension = (filename, allowedExtensions) => {
  if (!filename || !allowedExtensions || !Array.isArray(allowedExtensions)) {
    return false;
  }
  
  const extension = filename.split('.').pop().toLowerCase();
  return allowedExtensions.includes(extension);
};

/**
 * Common validation chains for express-validator
 */
const validationChains = {
  // User validation
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  displayName: body('displayName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  
  // Module validation
  moduleName: body('name')
    .notEmpty()
    .withMessage('Module name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Module name must be between 1 and 100 characters'),
  
  moduleDescription: body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  
  moduleColor: body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  
  // Note validation
  noteTitle: body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  
  // ID validation
  moduleId: body('moduleId')
    .notEmpty()
    .withMessage('Module ID is required'),
  
  noteId: body('noteId')
    .notEmpty()
    .withMessage('Note ID is required')
};

/**
 * Validate request data and return errors if any
 * @param {Object} req - Express request object
 * @returns {Object|null} - Validation errors or null if valid
 */
const validateRequest = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return {
      success: false,
      errors: errors.array()
    };
  }
  return null;
};

module.exports = {
  isValidEmail,
  validatePasswordStrength,
  isValidHexColor,
  isValidFileExtension,
  validationChains,
  validateRequest
};