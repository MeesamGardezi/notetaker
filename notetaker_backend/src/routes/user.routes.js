/**
 * User Routes
 */

const express = require('express');
const userController = require('../controllers/user.controller');
const { validateUser, validate } = require('../middleware/validation.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user profile
router.route('/profile')
  .get(userController.getProfile)
  .put(validateUser.updateProfile, validate, userController.updateProfile)
  .all(methodNotAllowed(['GET', 'PUT']));

// Get account usage statistics
router.route('/usage-stats')
  .get(userController.getUsageStats)
  .all(methodNotAllowed(['GET']));

// Delete user account
router.route('/delete-account')
  .delete(userController.deleteAccount)
  .all(methodNotAllowed(['DELETE']));

// Upgrade account tier
router.route('/upgrade-tier')
  .post(
    [
      express.json(),
      express.urlencoded({ extended: true }),
      (req, res, next) => {
        if (!req.body.tierName) {
          return res.status(400).json({
            success: false,
            message: 'Tier name is required'
          });
        }
        next();
      }
    ],
    userController.upgradeTier
  )
  .all(methodNotAllowed(['POST']));

module.exports = router;