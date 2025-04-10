/**
 * Validation Middleware
 * Provides validation for API requests
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validate user registration
 */
const validateUser = {
  register: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('displayName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters')
  ],
  
  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  resetPassword: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ],
  
  updateProfile: [
    body('displayName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
    body('photoURL')
      .optional()
      .isURL()
      .withMessage('Photo URL must be a valid URL')
  ]
};

/**
 * Validate module-related requests
 */
const validateModule = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Module name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Module name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be at most 500 characters'),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color code')
  ],
  
  update: [
    param('id')
      .notEmpty()
      .withMessage('Module ID is required'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Module name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be at most 500 characters'),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color code')
  ],
  
  reorder: [
    body('order')
      .isArray()
      .withMessage('Order must be an array'),
    body('order.*.id')
      .notEmpty()
      .withMessage('Each order item must have an id'),
    body('order.*.position')
      .isInt({ min: 1 })
      .withMessage('Each order item must have a valid position')
  ]
};

/**
 * Validate note-related requests
 */
const validateNote = {
  create: [
    body('moduleId')
      .notEmpty()
      .withMessage('Module ID is required'),
    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    body('content')
      .optional()
  ],
  
  update: [
    param('id')
      .notEmpty()
      .withMessage('Note ID is required'),
    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    body('content')
      .optional()
  ],
  
  reorder: [
    body('moduleId')
      .notEmpty()
      .withMessage('Module ID is required'),
    body('order')
      .isArray()
      .withMessage('Order must be an array'),
    body('order.*.id')
      .notEmpty()
      .withMessage('Each order item must have an id'),
    body('order.*.position')
      .isInt({ min: 1 })
      .withMessage('Each order item must have a valid position')
  ]
};

/**
 * Validate media-related requests
 */
const validateMedia = {
  upload: [
    body('noteId')
      .notEmpty()
      .withMessage('Note ID is required')
  ],
  
  delete: [
    param('id')
      .notEmpty()
      .withMessage('Media ID is required'),
    body('noteId')
      .notEmpty()
      .withMessage('Note ID is required')
  ],
  
  getSignedUrl: [
    param('id')
      .notEmpty()
      .withMessage('Media ID is required'),
    query('noteId')
      .notEmpty()
      .withMessage('Note ID is required')
  ]
};

/**
 * Validate results and return errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateUser,
  validateModule,
  validateNote,
  validateMedia,
  validate
};