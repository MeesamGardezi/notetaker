/**
 * Media Controller
 * Handles HTTP requests related to media file management
 */

const mediaService = require('../services/media.service');
const tierService = require('../services/tier.service');
const { validationResult } = require('express-validator');
const multer = require('multer');
const config = require('../config/app.config');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    // Check if file type is allowed
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('File type not allowed'));
  }
});

/**
 * Upload media file to a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const uploadMedia = [
  // Use multer middleware to handle file upload
  upload.single('file'),
  
  async (req, res, next) => {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const userId = req.user.uid;
      const noteId = req.body.noteId;
      const fileData = req.file;
      const fileBuffer = req.file.buffer;

      // Check tier limitations for storage
      const canUpload = await tierService.canUploadFile(userId, fileBuffer.length);
      if (!canUpload) {
        return res.status(403).json({
          success: false,
          message: 'Storage limit reached for your account tier or file size too large'
        });
      }

      // Upload media through service
      const mediaFile = await mediaService.uploadMedia(userId, noteId, fileData, fileBuffer);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        data: mediaFile
      });
    } catch (error) {
      if (error.message === 'Note not found' || error.message === 'Unauthorized access to note') {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }
      
      if (error.message === 'File type not allowed') {
        return res.status(400).json({
          success: false,
          message: 'File type not allowed'
        });
      }
      
      if (error.message.includes('Storage limit')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      next(error);
    }
  }
];

/**
 * Delete media file from a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteMedia = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const mediaId = req.params.id;
    const noteId = req.body.noteId; // Note ID is needed to locate the media

    // Delete media through service
    await mediaService.deleteMedia(userId, noteId, mediaId);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Note not found' || error.message === 'Unauthorized access to note') {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    if (error.message === 'Media file not found in note') {
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }
    
    next(error);
  }
};

/**
 * Get all media files for a note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMedia = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const noteId = req.params.noteId;

    // Get media files through service
    const mediaFiles = await mediaService.getNoteMedia(userId, noteId);

    // Return media files
    res.status(200).json({
      success: true,
      data: {
        media: mediaFiles,
        count: mediaFiles.length
      }
    });
  } catch (error) {
    if (error.message === 'Note not found' || error.message === 'Unauthorized access to note') {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    next(error);
  }
};

/**
 * Get signed URL for a media file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getSignedUrl = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const mediaId = req.params.id;
    const noteId = req.query.noteId;

    // Get signed URL through service
    const signedUrl = await mediaService.getSignedUrl(userId, noteId, mediaId);

    // Return signed URL
    res.status(200).json({
      success: true,
      data: {
        url: signedUrl
      }
    });
  } catch (error) {
    if (error.message === 'Note not found' || error.message === 'Unauthorized access to note') {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    if (error.message === 'Media file not found in note') {
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }
    
    next(error);
  }
};

module.exports = {
  uploadMedia,
  deleteMedia,
  getMedia,
  getSignedUrl
};