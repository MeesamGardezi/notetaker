/**
 * Media Routes
 */

const express = require('express');
const mediaController = require('../controllers/media.controller');
const { validateMedia, validate } = require('../middleware/validation.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { handleUploadError } = require('../middleware/upload.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Upload media to a note
router.route('/upload')
  .post(validateMedia.upload, validate, mediaController.uploadMedia, handleUploadError)
  .all(methodNotAllowed(['POST']));

// Get all media for a note
router.route('/note/:noteId')
  .get(mediaController.getMedia)
  .all(methodNotAllowed(['GET']));

// Get signed URL for media file
router.route('/url/:id')
  .get(validateMedia.getSignedUrl, validate, mediaController.getSignedUrl)
  .all(methodNotAllowed(['GET']));

// Delete media
router.route('/:id')
  .delete(validateMedia.delete, validate, mediaController.deleteMedia)
  .all(methodNotAllowed(['DELETE']));

module.exports = router;