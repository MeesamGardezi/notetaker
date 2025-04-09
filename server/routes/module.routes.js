/**
 * Module Routes
 */

const express = require('express');
const { body } = require('express-validator');
const moduleController = require('../controllers/module.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { canCreateModule } = require('../middleware/tier.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes for all modules
router.route('/')
  .get(moduleController.getUserModules)
  .post([
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
  ], canCreateModule, moduleController.createModule)
  .all(methodNotAllowed(['GET', 'POST']));

// Reorder modules
router.route('/reorder')
  .put([
    body('order')
      .isArray()
      .withMessage('Order must be an array'),
    body('order.*.id')
      .notEmpty()
      .withMessage('Each order item must have an id'),
    body('order.*.position')
      .isInt({ min: 1 })
      .withMessage('Each order item must have a valid position')
  ], moduleController.reorderModules)
  .all(methodNotAllowed(['PUT']));

// Routes for a specific module
router.route('/:id')
  .get(moduleController.getModuleById)
  .put([
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
  ], moduleController.updateModule)
  .delete(moduleController.deleteModule)
  .all(methodNotAllowed(['GET', 'PUT', 'DELETE']));

module.exports = router;