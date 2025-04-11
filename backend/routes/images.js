/**
 * Image Routes
 */

const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticate } = require('../middleware/auth');
const { checkImageLimits } = require('../middleware/tierLimits');
const { uploadSingle, processImage } = require('../middleware/fileUpload');
const { apiLimiter } = require('../middleware/rateLimiter');

// Upload an image for a note
router.post(
  '/note/:noteId',
  authenticate,
  apiLimiter,
  checkImageLimits,
  uploadSingle,
  processImage,
  imageController.uploadImage
);

// Get all images for a note
router.get(
  '/note/:noteId',
  authenticate,
  imageController.getNoteImages
);

// Delete an image
router.delete(
  '/:imageId',
  authenticate,
  imageController.deleteImage
);

// Get all images for user (paginated)
router.get(
  '/',
  authenticate,
  imageController.getUserImages
);

module.exports = router;