/**
 * Authentication Middleware
 * Handles authentication and authorization for API routes
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { admin, auth } = require('../config/firebase-admin');
const authService = require('../services/auth.service');

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    let token = null;
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, check cookies
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Get user data from Firebase
    const userRecord = await auth.getUser(decoded.uid);
    
    // Check if user account is active
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    
    if (!userDoc.exists || userDoc.data().status === 'deleted') {
      return res.status(401).json({
        success: false,
        message: 'User account is deleted or does not exist'
      });
    }
    
    // Set user data in request
    req.user = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      tier: decoded.tier
    };
    
    next();
  } catch (error) {
    // Handle expired or invalid token
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    // Handle Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has the required tier
 * @param {string[]} requiredTiers - Array of required tier names
 * @returns {Function} - Express middleware function
 */
const requireTier = (requiredTiers) => {
  return (req, res, next) => {
    // Verify token middleware should run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user's tier is in the required tiers
    if (requiredTiers.includes(req.user.tier)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Insufficient tier privileges'
      });
    }
  };
};

module.exports = {
  verifyToken,
  requireTier
};