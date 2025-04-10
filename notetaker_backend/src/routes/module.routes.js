/**
 * Module Routes
 */

const express = require('express');
const moduleController = require('../controllers/module.controller');
const { validateModule, validate } = require('../middleware/validation.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes for all modules
router.route('/')
  .get(moduleController.getModules)
  .post(validateModule.create, validate, moduleController.createModule)
  .all(methodNotAllowed(['GET', 'POST']));

// Reorder modules
router.route('/reorder')
  .put(validateModule.reorder, validate, moduleController.reorderModules)
  .all(methodNotAllowed(['PUT']));

// Routes for a specific module
router.route('/:id')
  .get(moduleController.getModuleById)
  .put(validateModule.update, validate, moduleController.updateModule)
  .delete(moduleController.deleteModule)
  .all(methodNotAllowed(['GET', 'PUT', 'DELETE']));

module.exports = router;