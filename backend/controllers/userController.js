/**
 * User Controller
 * Handles user profile operations
 */

const { collections, Timestamp } = require('../config/firebase');
const { hashPassword, comparePassword } = require('../utils/password');

/**
 * Get user profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get user document
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userData = userDoc.data();

    // Return sanitized user data (exclude sensitive info)
    res.status(200).json({
      id: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      photoUrl: userData.photoUrl,
      tier: userData.tier,
      settings: userData.settings,
      createdAt: userData.createdAt.toMillis(),
      lastLoginAt: userData.lastLoginAt.toMillis()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { displayName, photoUrl, settings } = req.body;

    // Get user document
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Build update object
    const updateData = {};
    
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    
    if (photoUrl !== undefined) {
      updateData.photoUrl = photoUrl;
    }
    
    if (settings !== undefined) {
      const userData = userDoc.data();
      updateData.settings = {
        ...userData.settings,
        ...settings
      };
    }

    // Update user
    if (Object.keys(updateData).length > 0) {
      await userDoc.ref.update(updateData);
    }

    // Get updated user data
    const updatedUserDoc = await collections.users.doc(userId).get();
    const updatedUserData = updatedUserDoc.data();

    // Return updated user data
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUserDoc.id,
        email: updatedUserData.email,
        displayName: updatedUserData.displayName,
        photoUrl: updatedUserData.photoUrl,
        tier: updatedUserData.tier,
        settings: updatedUserData.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    // Get user document
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userData = userDoc.data();

    // Verify current password
    const isValid = await comparePassword(currentPassword, userData.passwordHash, userData.salt);
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Generate new password hash
    const { hash, salt } = await hashPassword(newPassword);

    // Update user with new password
    await userDoc.ref.update({
      passwordHash: hash,
      salt,
      activeTokens: [] // Logout from all devices
    });

    return res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user tier
 * (Would typically be called by an admin or payment webhook)
 */
exports.updateTier = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    // Validate tier
    if (!['free', 'premium'].includes(tier)) {
      return res.status(400).json({ 
        error: 'Invalid tier. Must be "free" or "premium"' 
      });
    }

    // Get user document
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Update user tier
    await userDoc.ref.update({ tier });

    return res.status(200).json({
      message: `User tier updated to ${tier}`
    });
  } catch (error) {
    next(error);
  }
};