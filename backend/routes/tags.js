/**
 * Tag Routes
 */

const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { checkTagLimits } = require('../middleware/tierLimits');
const { apiLimiter } = require('../middleware/rateLimiter');

// Get all tags for user
router.get(
  '/',
  authenticate,
  tagController.getTags
);

// Create a new tag
router.post(
  '/',
  authenticate,
  apiLimiter,
  checkTagLimits,
  validate(schemas.createTag),
  tagController.createTag
);

// Update a tag
router.patch(
  '/:tagId',
  authenticate,
  validate(schemas.updateTag),
  tagController.updateTag
);

// Delete a tag
router.delete(
  '/:tagId',
  authenticate,
  tagController.deleteTag
);

// Get notes by tag
router.get(
  '/:tagId/notes',
  authenticate,
  tagController.getNotesByTag
);

module.exports = router;