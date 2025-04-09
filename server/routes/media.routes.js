/**
 * Media Routes
 */

const express = require('express');
const { body } = require('express-validator');
const mediaController = require('../controllers/media.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { handleUploadError } = require('../middleware/upload.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Upload media to a note
router.route('/upload')
  .post([
    body('noteId')
      .notEmpty()
      .withMessage('Note ID is required')
  ], mediaController.uploadMedia, handleUploadError)
  .all(methodNotAllowed(['POST']));

// Get all media for a note
router.route('/note/:noteId')
  .get(mediaController.getNoteMedia)
  .all(methodNotAllowed(['GET']));

// Delete media
router.route('/:id')
  .delete([
    body('noteId')
      .notEmpty()
      .withMessage('Note ID is required')
  ], mediaController.deleteMedia)
  .all(methodNotAllowed(['DELETE']));

module.exports = router;