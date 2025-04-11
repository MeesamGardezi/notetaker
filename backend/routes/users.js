/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { sensitiveOpLimiter } = require('../middleware/rateLimiter');

// Get user profile
router.get(
  '/profile',
  authenticate,
  userController.getProfile
);

// Update user profile
router.patch(
  '/profile',
  authenticate,
  validate(schemas.updateProfile),
  userController.updateProfile
);

// Change user password
router.post(
  '/change-password',
  authenticate,
  sensitiveOpLimiter,
  validate(schemas.changePassword),
  userController.changePassword
);

// Update user tier (admin only route - would typically be protected further)
router.patch(
  '/:userId/tier',
  authenticate,
  userController.updateTier
);

module.exports = router;