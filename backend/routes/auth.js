/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Register new user
router.post(
  '/register', 
  registerLimiter,
  validate(schemas.register), 
  authController.register
);

// Login user
router.post(
  '/login', 
  loginLimiter,
  validate(schemas.login), 
  authController.login
);

// Refresh token
router.post(
  '/refresh-token', 
  authenticate, 
  authController.refreshToken
);

// Logout user
router.post(
  '/logout', 
  authenticate, 
  authController.logout
);

// Logout from all devices
router.post(
  '/logout-all', 
  authenticate, 
  authController.logoutAll
);

module.exports = router;