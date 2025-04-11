/**
 * Authentication Middleware
 * Verifies JWT tokens and adds user data to request object
 */

const { verifyToken } = require('../utils/jwt');
const { collections } = require('../config/firebase');

/**
 * Authenticate requests using JWT
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if token exists in user's active tokens
    const userDoc = await collections.users.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const tokenExists = userData.activeTokens.some(t => t.tokenId === decoded.tokenId);
    
    if (!tokenExists) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Add user data to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      tokenId: decoded.tokenId
    };

    // Update token last used timestamp (but don't wait for it)
    const tokenIndex = userData.activeTokens.findIndex(t => t.tokenId === decoded.tokenId);
    if (tokenIndex !== -1) {
      const activeTokens = [...userData.activeTokens];
      activeTokens[tokenIndex] = {
        ...activeTokens[tokenIndex],
        lastUsed: collections.Timestamp.now()
      };
      
      userDoc.ref.update({ activeTokens }).catch(err => {
        console.error('Error updating token last used timestamp:', err);
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication
 * Same as authenticate but doesn't return error if no token is provided
 */
exports.optionalAuthenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return next();
    }

    // Check if token exists in user's active tokens
    const userDoc = await collections.users.doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return next();
    }

    const userData = userDoc.data();
    const tokenExists = userData.activeTokens.some(t => t.tokenId === decoded.tokenId);
    
    if (!tokenExists) {
      return next();
    }

    // Add user data to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      tokenId: decoded.tokenId
    };

    // Update token last used timestamp (but don't wait for it)
    const tokenIndex = userData.activeTokens.findIndex(t => t.tokenId === decoded.tokenId);
    if (tokenIndex !== -1) {
      const activeTokens = [...userData.activeTokens];
      activeTokens[tokenIndex] = {
        ...activeTokens[tokenIndex],
        lastUsed: collections.Timestamp.now()
      };
      
      userDoc.ref.update({ activeTokens }).catch(err => {
        console.error('Error updating token last used timestamp:', err);
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};