/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout
 */

const { collections, Timestamp } = require('../config/firebase');
const { generateToken, verifyToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');
const { v4: uuidv4 } = require('uuid');

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if email already exists using a simple query
    const usersSnapshot = await collections.users
      .where('email', '==', email.toLowerCase())
      .get();

    if (!usersSnapshot.empty) {
      return res.status(409).json({ 
        error: 'Email already in use' 
      });
    }

    // Generate password hash and salt
    const { hash, salt } = await hashPassword(password);

    // Create new user object
    const newUser = {
      email: email.toLowerCase(),
      passwordHash: hash,
      salt,
      displayName: displayName || email.split('@')[0],
      photoUrl: null,
      tier: 'free', // Default tier
      activeTokens: [],
      settings: {
        theme: 'system',
        fontSizePreference: 16
      },
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now()
    };

    // Add user to Firestore
    const userRef = await collections.users.add(newUser);
    
    // Generate JWT token
    const tokenId = uuidv4();
    const token = generateToken({ 
      userId: userRef.id, 
      email: newUser.email, 
      tokenId 
    });

    // Add token to user's active tokens
    await userRef.update({
      activeTokens: [{
        tokenId,
        lastUsed: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        device: req.headers['user-agent'] || null
      }]
    });

    // Return user info and token
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userRef.id,
        email: newUser.email,
        displayName: newUser.displayName,
        photoUrl: newUser.photoUrl,
        tier: newUser.tier,
        settings: newUser.settings
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get user by email with a simple query
    const usersSnapshot = await collections.users
      .where('email', '==', email.toLowerCase())
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValid = await comparePassword(password, userData.passwordHash, userData.salt);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate new token
    const tokenId = uuidv4();
    const token = generateToken({ 
      userId: userDoc.id, 
      email: userData.email,
      tokenId
    });

    // Update user's active tokens and last login
    const tokenData = {
      tokenId,
      lastUsed: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
      device: req.headers['user-agent'] || null
    };

    // Limit number of active tokens (keep most recent 5)
    const activeTokens = [...userData.activeTokens || []]
      .filter(token => token.expiresAt.toMillis() > Date.now()) // Remove expired tokens
      .slice(0, 4); // Keep only 4 most recent tokens (plus the new one)
    
    activeTokens.push(tokenData);

    await userDoc.ref.update({
      activeTokens,
      lastLoginAt: Timestamp.now()
    });

    // Return user info and token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        photoUrl: userData.photoUrl,
        tier: userData.tier,
        settings: userData.settings
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh user token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { userId, tokenId } = req.user;

    // Get user document
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userData = userDoc.data();
    
    // Find the token in active tokens
    const tokenIndex = userData.activeTokens.findIndex(token => token.tokenId === tokenId);
    if (tokenIndex === -1) {
      return res.status(401).json({ 
        error: 'Invalid token' 
      });
    }

    // Generate new token
    const newTokenId = uuidv4();
    const token = generateToken({ 
      userId, 
      email: userData.email,
      tokenId: newTokenId
    });

    // Update the token
    const activeTokens = [...userData.activeTokens];
    activeTokens[tokenIndex] = {
      tokenId: newTokenId,
      lastUsed: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
      device: req.headers['user-agent'] || null
    };

    await userDoc.ref.update({ activeTokens });

    return res.status(200).json({
      message: 'Token refreshed',
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res, next) => {
  try {
    const { userId, tokenId } = req.user;

    // Get user document
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Remove token from active tokens
    const userData = userDoc.data();
    const updatedTokens = userData.activeTokens.filter(token => token.tokenId !== tokenId);

    await userDoc.ref.update({
      activeTokens: updatedTokens
    });

    return res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all devices
 */
exports.logoutAll = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get user document
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Clear all tokens
    await userDoc.ref.update({
      activeTokens: []
    });

    return res.status(200).json({
      message: 'Logged out from all devices'
    });
  } catch (error) {
    next(error);
  }
};