/**
 * Note Routes
 */

const express = require('express');
const { body } = require('express-validator');
const noteController = require('../controllers/note.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { canCreateNote } = require('../middleware/tier.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes for creating notes
router.route('/')
  .post([
    body('moduleId')
      .notEmpty()
      .withMessage('Module ID is required'),
    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    body('content')
      .optional()
  ], canCreateNote, noteController.createNote)
  .all(methodNotAllowed(['POST']));

// Get all notes for a module
router.route('/module/:moduleId')
  .get(noteController.getModuleNotes)
  .all(methodNotAllowed(['GET']));

// Reorder notes
router.route('/reorder')
  .put([
    body('moduleId')
      .notEmpty()
      .withMessage('Module ID is required'),
    body('order')
      .isArray()
      .withMessage('Order must be an array'),
    body('order.*.id')
      .notEmpty()
      .withMessage('Each order item must have an id'),
    body('order.*.position')
      .isInt({ min: 1 })
      .withMessage('Each order item must have a valid position')
  ], noteController.reorderNotes)
  .all(methodNotAllowed(['PUT']));

// Routes for a specific note
router.route('/:id')
  .get(noteController.getNoteById)
  .put([
    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    body('content')
      .optional()
  ], noteController.updateNote)
  .delete(noteController.deleteNote)
  .all(methodNotAllowed(['GET', 'PUT', 'DELETE']));

module.exports = router;