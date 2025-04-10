/**
 * User Controller
 * Handles HTTP requests related to user profile operations
 */

const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const tierService = require('../services/tier.service');
const storageService = require('../services/storage.service');
const { validationResult } = require('express-validator');
const { admin, db } = require('../config/firebase.config');

/**
 * Get user profile details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get user profile through service
    const userProfile = await userService.getUserProfile(userId);

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
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const { displayName, photoURL } = req.body;

    // Update profile through service
    const updatedProfile = await userService.updateProfile(userId, { displayName, photoURL });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: updatedProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get account usage statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUsageStats = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get user profile to get basic usage stats
    const userProfile = await userService.getUserProfile(userId);
    
    // Get tier information and limits
    const tierInfo = await tierService.getUserTier(userId);
    
    // Get storage statistics
    const storageStats = await storageService.getUserStorageStats(userId);
    
    // Format bytes for human-readable output
    const formatBytes = (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    // Return combined stats
    res.status(200).json({
      success: true,
      data: {
        moduleCount: userProfile.moduleCount,
        noteCount: userProfile.noteCount,
        storageUsed: userProfile.storageUsed,
        storageUsedFormatted: formatBytes(userProfile.storageUsed),
        tier: tierInfo,
        storage: {
          ...storageStats,
          totalSizeFormatted: formatBytes(storageStats.totalSize)
        }
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
    await userService.deleteUser(userId);

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

/**
 * Upgrade user account tier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const upgradeTier = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const { tierName } = req.body;

    // Upgrade tier through service
    const updatedTierInfo = await tierService.upgradeTier(userId, tierName);

    // Return success response
    res.status(200).json({
      success: true,
      message: `Account upgraded to ${tierName} tier`,
      data: updatedTierInfo
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUsageStats,
  deleteAccount,
  upgradeTier
};