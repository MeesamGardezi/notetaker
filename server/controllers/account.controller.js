/**
 * Account Controller
 * Handles HTTP requests related to user account management
 */

const authService = require('../services/auth.service');
const tierService = require('../services/tier.service');
const storageService = require('../services/storage.service');
const { validationResult } = require('express-validator');
const { admin, db } = require('../config/firebase-admin');

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

    // Update user document in Firestore
    const userRef = db.collection('users').doc(userId);
    
    // Prepare update object
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    }
    
    await userRef.update(updateData);

    // Get updated profile
    const updatedProfile = await authService.getUserProfile(userId);

    // Return updated profile
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
    const userProfile = await authService.getUserProfile(userId);
    
    // Get tier information and limits
    const tierInfo = await tierService.getUserTier(userId);
    
    // Get storage statistics
    const storageStats = await storageService.getUserStorageStats(userId);
    
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
 * Get account tier information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTierInfo = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get tier information through service
    const tierInfo = await tierService.getUserTier(userId);

    // Return tier information
    res.status(200).json({
      success: true,
      data: tierInfo
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

/**
 * Clean up orphaned storage files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const cleanupStorage = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Clean up orphaned files
    const cleanupResults = await storageService.cleanupOrphanedFiles(userId);

    // Update user's storage usage if files were deleted
    if (cleanupResults.deletedCount > 0) {
      const userRef = db.collection('users').doc(userId);
      
      await userRef.update({
        storageUsed: admin.firestore.FieldValue.increment(-cleanupResults.totalSizeRecovered),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Return cleanup results
    res.status(200).json({
      success: true,
      message: `Cleanup complete. Deleted ${cleanupResults.deletedCount} files and recovered ${formatBytes(cleanupResults.totalSizeRecovered)} of storage.`,
      data: {
        filesDeleted: cleanupResults.deletedCount,
        sizeRecovered: cleanupResults.totalSizeRecovered,
        sizeRecoveredFormatted: formatBytes(cleanupResults.totalSizeRecovered)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Utility function to format bytes into a human-readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places
 * @returns {string} - Formatted string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

module.exports = {
  getProfile,
  updateProfile,
  getUsageStats,
  getTierInfo,
  deleteAccount,
  cleanupStorage
};