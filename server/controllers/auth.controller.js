/**
 * Authentication Controller
 * Handles HTTP requests related to user authentication
 */

const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');
const { admin, db } = require('../config/firebase-admin');
const config = require('../config/config');
const jwt = require('jsonwebtoken');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, displayName } = req.body;

    // Create user through service
    const userData = await authService.createUser(email, password, displayName);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Check your email for verification.',
      data: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName
      }
    });
  } catch (error) {
    // Handle Firebase specific errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    next(error);
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Authenticate user through service
    const { user, token } = await authService.loginUser(email, password);

    // Send auth token in HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user
      }
    });
  } catch (error) {
    // Handle Firebase specific errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    next(error);
  }
};

/**
 * Login with Google
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const loginWithGoogle = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { idToken } = req.body;

    // Verify Google ID token
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Get user record from Firebase Auth
      const userRecord = await admin.auth().getUser(uid);
      
      // Check if user exists in Firestore
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        const userData = {
          email: userRecord.email,
          displayName: userRecord.displayName || 'User',
          photoURL: userRecord.photoURL || null,
          accountTier: 'free',
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          moduleCount: 0,
          noteCount: 0,
          storageUsed: 0
        };

        await userRef.set(userData);
      } else {
        // Update last login timestamp
        await userRef.update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Get current user data
      const currentUserDoc = userDoc.exists ? userDoc.data() : await userRef.get().then(doc => doc.data());
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          uid: uid,
          email: userRecord.email,
          tier: currentUserDoc.accountTier || 'free'
        }, 
        config.jwt.secret, 
        { expiresIn: config.jwt.expiresIn }
      );
      
      // Send auth token in HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: {
          user: {
            uid: uid,
            email: userRecord.email,
            displayName: userRecord.displayName || 'User',
            photoURL: userRecord.photoURL,
            accountTier: currentUserDoc.accountTier || 'free'
          }
        }
      });
    } catch (error) {
      // Handle Firebase token verification errors
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  // Clear auth token cookie
  res.clearCookie('auth_token');
  
  // Return success response
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

/**
 * Verify auth token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Token should be available from auth middleware
    const user = req.user;
    
    // Return user data
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requestPasswordReset = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Request password reset through service
    await authService.sendPasswordResetEmail(email);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    // Don't expose whether email exists for security
    if (error.code === 'auth/user-not-found') {
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent'
      });
    }
    
    next(error);
  }
};

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get user profile through service
    const userProfile = await authService.getUserProfile(userId);

    // Return user profile
    res.status(200).json({
      success: true,
      data: {
        profile: userProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Delete account through service
    await authService.deleteUser(userId);

    // Clear auth token cookie
    res.clearCookie('auth_token');

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  loginWithGoogle,
  logout,
  verifyToken,
  requestPasswordReset,
  getUserProfile,
  deleteAccount
};