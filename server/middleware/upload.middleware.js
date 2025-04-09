/**
 * Upload Middleware
 * Handles file upload processing
 */

const multer = require('multer');
const config = require('../config/config');
const tierService = require('../services/tier.service');

// Configure multer for memory storage
const memoryStorage = multer.memoryStorage();

/**
 * Configure multer with validation based on user's tier
 * @param {Object} options - Configuration options
 * @returns {Object} - Configured multer middleware
 */
const configureUpload = (options = {}) => {
  const fileSize = options.maxFileSize || config.upload.maxFileSize;
  const allowedTypes = options.allowedMimeTypes || config.upload.allowedMimeTypes;
  
  return multer({
    storage: memoryStorage,
    limits: {
      fileSize
    },
    fileFilter: async (req, file, cb) => {
      try {
        // Check if file type is allowed
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('File type not allowed'));
        }
        
        // Only check tier limits if user is authenticated
        if (req.user && req.user.uid) {
          // Predict file size from content-length if available
          const contentLength = req.headers['content-length'];
          const estimatedSize = contentLength ? parseInt(contentLength, 10) : fileSize;
          
          // Check if user can upload this file size
          const canUpload = await tierService.canUploadFile(req.user.uid, estimatedSize);
          
          if (!canUpload) {
            return cb(new Error('Storage limit reached for your account tier'));
          }
        }
        
        // If all checks pass, accept the file
        cb(null, true);
      } catch (error) {
        cb(error);
      }
    }
  });
};

/**
 * Middleware for handling file upload errors
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error occurred
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the limit of ${config.upload.maxFileSize / 1048576}MB`
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    // Custom validation error
    if (err.message === 'File type not allowed') {
      return res.status(400).json({
        success: false,
        message: 'File type not allowed',
        allowedTypes: config.upload.allowedMimeTypes
      });
    } else if (err.message.includes('Storage limit')) {
      return res.status(403).json({
        success: false,
        message: err.message
      });
    }
    
    // Other error
    next(err);
  } else {
    // No error, continue
    next();
  }
};

// Export pre-configured middleware for common scenarios
const singleFileUpload = configureUpload().single('file');
const multipleFilesUpload = configureUpload().array('files', 10);

module.exports = {
  configureUpload,
  handleUploadError,
  singleFileUpload,
  multipleFilesUpload
};