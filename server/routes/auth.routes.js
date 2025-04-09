/**
 * Authentication Routes
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Register a new user
router.route('/register')
  .post([
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('displayName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters')
  ], authController.register)
  .all(methodNotAllowed(['POST']));

// Login user
router.route('/login')
  .post([
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ], authController.login)
  .all(methodNotAllowed(['POST']));

// Logout user
router.route('/logout')
  .get(authController.logout)
  .all(methodNotAllowed(['GET']));

// Verify token
router.route('/verify-token')
  .get(verifyToken, authController.verifyToken)
  .all(methodNotAllowed(['GET']));

// Request password reset
router.route('/reset-password')
  .post([
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
  ], authController.requestPasswordReset)
  .all(methodNotAllowed(['POST']));

// Get user profile
router.route('/user-profile')
  .get(verifyToken, authController.getUserProfile)
  .all(methodNotAllowed(['GET']));

module.exports = router;