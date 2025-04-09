/**
 * Account Routes
 */

const express = require('express');
const { body } = require('express-validator');
const accountController = require('../controllers/account.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user profile
router.route('/profile')
  .get(accountController.getProfile)
  .put([
    body('displayName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
    body('photoURL')
      .optional()
      .isURL()
      .withMessage('Photo URL must be a valid URL')
  ], accountController.updateProfile)
  .all(methodNotAllowed(['GET', 'PUT']));

// Get account usage statistics
router.route('/usage-stats')
  .get(accountController.getUsageStats)
  .all(methodNotAllowed(['GET']));

// Get account tier information
router.route('/tier')
  .get(accountController.getTierInfo)
  .all(methodNotAllowed(['GET']));

// Delete user account (soft delete)
router.route('/')
  .delete(accountController.deleteAccount)
  .all(methodNotAllowed(['DELETE']));

// Clean up orphaned storage files
router.route('/cleanup-storage')
  .post(accountController.cleanupStorage)
  .all(methodNotAllowed(['POST']));

module.exports = router;