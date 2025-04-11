/**
 * JWT Utilities
 * Functions for generating and verifying JWT tokens
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// Check if JWT secret is set
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode in the token
 * @returns {string} JWT token
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token data
 * @throws {AppError} If token is invalid or expired
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
};