/**
 * Authentication Routes
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateUser, validate } = require('../middleware/validation.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Register a new user
router.route('/register')
  .post(validateUser.register, validate, authController.register)
  .all(methodNotAllowed(['POST']));

// Login user
router.route('/login')
  .post(validateUser.login, validate, authController.login)
  .all(methodNotAllowed(['POST']));

// Logout user
router.route('/logout')
  .get(authController.logout)
  .all(methodNotAllowed(['GET']));

// Verify token
router.route('/verify-token')
  .get(verifyToken, authController.verifyToken)
  .all(methodNotAllowed(['GET']));

// Reset password
router.route('/reset-password')
  .post(validateUser.resetPassword, validate, authController.requestPasswordReset)
  .all(methodNotAllowed(['POST']));

module.exports = router;