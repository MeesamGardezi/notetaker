/**
 * Tier Middleware
 * Handles tier-based limitations for API routes
 */

const tierService = require('../services/tier.service');

/**
 * Middleware to check if user can create a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const canCreateModule = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    // Check if user can create a module
    const canCreate = await tierService.canCreateModule(userId);
    
    if (canCreate) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Module limit reached for your account tier'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking tier limitations',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user can create a note in a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const canCreateNote = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const moduleId = req.body.moduleId;
    
    // Check if user can create a note
    const canCreate = await tierService.canCreateNote(userId, moduleId);
    
    if (canCreate) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Note limit reached for this module in your account tier'
      });
    }
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized access to module') {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error checking tier limitations',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user can upload a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const canUploadFile = async (req, res, next) => {
  try {
    // Only check if there's a file to upload
    if (!req.file) {
      return next();
    }
    
    const userId = req.user.uid;
    const fileSize = req.file.size;
    
    // Check if user can upload the file
    const canUpload = await tierService.canUploadFile(userId, fileSize);
    
    if (canUpload) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Storage limit reached for your account tier or file size too large'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking tier limitations',
      error: error.message
    });
  }
};

module.exports = {
  canCreateModule,
  canCreateNote,
  canUploadFile
};