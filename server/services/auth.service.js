/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

const { admin, auth, db } = require('../config/firebase-admin');
const config = require('../config/config');
const jwt = require('jsonwebtoken');

/**
 * Create a new user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<Object>} - Created user data
 */
const createUser = async (email, password, displayName) => {
  try {
    // Create the user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Generate verification email link
    const emailVerificationLink = await auth.generateEmailVerificationLink(email);

    // Create user document in Firestore
    const userData = {
      email,
      displayName,
      photoURL: null,
      accountTier: 'free',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      moduleCount: 0,
      noteCount: 0,
      storageUsed: 0
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return {
      uid: userRecord.uid,
      emailVerificationLink,
      ...userData
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Login user and generate auth token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data and token
 */
const loginUser = async (email, password) => {
  try {
    // Verify user credentials with Firebase Auth
    const userCredential = await auth.getUserByEmail(email);
    
    // Check if user exists and is active
    const userDoc = await db.collection('users').doc(userCredential.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User record not found');
    }
    
    const userData = userDoc.data();
    
    if (userData.status === 'deleted') {
      throw new Error('User account has been deleted');
    }
    
    // Update last login timestamp
    await db.collection('users').doc(userCredential.uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: userCredential.uid,
        email: userCredential.email,
        tier: userData.accountTier 
      }, 
      config.jwt.secret, 
      { expiresIn: config.jwt.expiresIn }
    );
    
    return {
      user: {
        uid: userCredential.uid,
        email: userCredential.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        accountTier: userData.accountTier
      },
      token
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<string>} - Password reset link
 */
const sendPasswordResetEmail = async (email) => {
  try {
    const resetLink = await auth.generatePasswordResetLink(email);
    return resetLink;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user profile data
 * @param {string} uid - User ID
 * @returns {Promise<Object>} - User profile data
 */
const getUserProfile = async (uid) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    if (userData.status === 'deleted') {
      throw new Error('User account has been deleted');
    }
    
    return {
      uid: userDoc.id,
      ...userData
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Soft delete a user account
 * @param {string} uid - User ID
 * @returns {Promise<void>}
 */
const deleteUser = async (uid) => {
  try {
    // Soft delete by updating user status
    await db.collection('users').doc(uid).update({
      status: 'deleted',
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  loginUser,
  sendPasswordResetEmail,
  verifyToken,
  getUserProfile,
  deleteUser
};