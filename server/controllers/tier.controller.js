/**
 * Tier Controller
 * Handles HTTP requests related to account tier management
 */

const tierService = require('../services/tier.service');
const { validationResult } = require('express-validator');

/**
 * Get all available tiers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAvailableTiers = (req, res) => {
  try {
    // Get tiers through service
    const tiers = tierService.getAvailableTiers();

    // Return tiers
    res.status(200).json({
      success: true,
      data: {
        tiers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving tiers',
      error: error.message
    });
  }
};

/**
 * Get user's current tier information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserTier = async (req, res, next) => {
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
 * Upgrade user to a new tier
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

    // Validate tier name
    const availableTiers = tierService.getAvailableTiers();
    if (!availableTiers[tierName]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tier name'
      });
    }

    // Upgrade tier through service
    const updatedTierInfo = await tierService.upgradeTier(userId, tierName);

    // Return updated tier information
    res.status(200).json({
      success: true,
      message: `Account upgraded to ${tierName} tier`,
      data: updatedTierInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can create a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkModuleCreation = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Check through service
    const canCreate = await tierService.canCreateModule(userId);

    // Return result
    res.status(200).json({
      success: true,
      data: {
        canCreate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can create a note in a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkNoteCreation = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { moduleId } = req.params;

    // Check through service
    const canCreate = await tierService.canCreateNote(userId, moduleId);

    // Return result
    res.status(200).json({
      success: true,
      data: {
        canCreate
      }
    });
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized access to module') {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    next(error);
  }
};

/**
 * Check if user can upload a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkFileUpload = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { fileSize } = req.query;
    
    // Validate file size parameter
    const size = parseInt(fileSize, 10);
    if (isNaN(size) || size <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file size parameter'
      });
    }

    // Check through service
    const canUpload = await tierService.canUploadFile(userId, size);

    // Return result
    res.status(200).json({
      success: true,
      data: {
        canUpload
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableTiers,
  getUserTier,
  upgradeTier,
  checkModuleCreation,
  checkNoteCreation,
  checkFileUpload
};