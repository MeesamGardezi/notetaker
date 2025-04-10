/**
 * Note Routes
 */

const express = require('express');
const noteController = require('../controllers/note.controller');
const { validateNote, validate } = require('../middleware/validation.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes for creating notes
router.route('/')
  .post(validateNote.create, validate, noteController.createNote)
  .all(methodNotAllowed(['POST']));

// Get all notes for a module
router.route('/module/:moduleId')
  .get(noteController.getNotes)
  .all(methodNotAllowed(['GET']));

// Reorder notes
router.route('/reorder')
  .put(validateNote.reorder, validate, noteController.reorderNotes)
  .all(methodNotAllowed(['PUT']));

// Routes for a specific note
router.route('/:id')
  .get(noteController.getNoteById)
  .put(validateNote.update, validate, noteController.updateNote)
  .delete(noteController.deleteNote)
  .all(methodNotAllowed(['GET', 'PUT', 'DELETE']));

module.exports = router;