/**
 * File Upload Middleware
 * Handles file uploads without sharp dependency
 */

const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

// Memory storage for handling file uploads
const storage = multer.memoryStorage();

// File filter function to validate uploads
const fileFilter = (req, file, cb) => {
  // Check if the file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new AppError('Only image files are allowed', 400), false);
  }

  // Restrict to common image formats
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validMimeTypes.includes(file.mimetype)) {
    return cb(new AppError('Invalid image format. Supported formats: JPEG, PNG, GIF, WebP', 400), false);
  }

  // Allow the file
  cb(null, true);
};

// Configure multer for handling uploads
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max file size (50MB)
  }
});

/**
 * Single file upload middleware
 */
exports.uploadSingle = upload.single('image');

/**
 * Basic metadata extraction without sharp
 * This won't extract width/height but will allow uploads to work
 */
exports.processImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Add basic metadata to request object
    req.imageMetadata = {
      size: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname
    };

    next();
  } catch (error) {
    next(new AppError('Error processing image', 500));
  }
};