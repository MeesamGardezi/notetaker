/**
 * Module Routes
 */

const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { checkModuleLimits } = require('../middleware/tierLimits');
const { apiLimiter } = require('../middleware/rateLimiter');

// Get all modules
router.get(
  '/',
  authenticate,
  moduleController.getModules
);

// Create a new module
router.post(
  '/',
  authenticate,
  apiLimiter,
  checkModuleLimits,
  validate(schemas.createModule),
  moduleController.createModule
);

// Get a single module
router.get(
  '/:moduleId',
  authenticate,
  moduleController.getModule
);

// Update a module
router.patch(
  '/:moduleId',
  authenticate,
  validate(schemas.updateModule),
  moduleController.updateModule
);

// Delete a module
router.delete(
  '/:moduleId',
  authenticate,
  moduleController.deleteModule
);

// Reorder modules
router.post(
  '/reorder',
  authenticate,
  validate(schemas.reorderModules),
  moduleController.reorderModules
);

module.exports = router;