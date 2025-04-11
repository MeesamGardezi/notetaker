/**
 * Note Routes
 */

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { checkNoteLimits, checkNoteMoveLimit } = require('../middleware/tierLimits');
const { apiLimiter } = require('../middleware/rateLimiter');

// Create a new note
router.post(
  '/',
  authenticate,
  apiLimiter,
  checkNoteLimits,
  validate(schemas.createNote),
  noteController.createNote
);

// Get notes for a module
router.get(
  '/module/:moduleId',
  authenticate,
  noteController.getModuleNotes
);

// Get starred notes
router.get(
  '/starred',
  authenticate,
  noteController.getStarredNotes
);

// Get recent notes
router.get(
  '/recent',
  authenticate,
  noteController.getRecentNotes
);

// Search notes
router.get(
  '/search',
  authenticate,
  noteController.searchNotes
);

// Get a single note
router.get(
  '/:noteId',
  authenticate,
  noteController.getNote
);

// Update a note
router.patch(
  '/:noteId',
  authenticate,
  checkNoteMoveLimit,
  validate(schemas.updateNote),
  noteController.updateNote
);

// Delete a note
router.delete(
  '/:noteId',
  authenticate,
  noteController.deleteNote
);

module.exports = router;