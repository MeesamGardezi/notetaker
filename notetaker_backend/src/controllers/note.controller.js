/**
 * Note Controller
 * Handles HTTP requests related to note management
 */

const noteService = require('../services/note.service');
const tierService = require('../services/tier.service');
const { validationResult } = require('express-validator');

/**
 * Create a new note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createNote = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const moduleId = req.body.moduleId;
    const noteData = {
      title: req.body.title,
      content: req.body.content
    };

    // Check tier limitations
    const canCreate = await tierService.canCreateNote(userId, moduleId);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'Note limit reached for this module in your account tier'
      });
    }

    // Create note through service
    const newNote = await noteService.createNote(userId, moduleId, noteData);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: newNote
    });
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized access to module') {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    next(error);
  }
};

/**
 * Get all notes for a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getNotes = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const moduleId = req.params.moduleId;

    // Get notes through service
    const notes = await noteService.getModuleNotes(moduleId, userId);

    // Return notes
    res.status(200).json({
      success: true,
      data: {
        notes,
        count: notes.length
      }
    });
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized access to module') {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    next(error);
  }
};

/**
 * Get note by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getNoteById = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const noteId = req.params.id;

    // Get note through service
    const note = await noteService.getNoteById(noteId, userId);

    // Return note
    res.status(200).json({
      success: true,
      data: note
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
 * Update note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateNote = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const noteId = req.params.id;
    const updateData = {
      title: req.body.title,
      content: req.body.content
    };

    // Update note through service
    const updatedNote = await noteService.updateNote(noteId, userId, updateData);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote
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
 * Delete note
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteNote = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const noteId = req.params.id;

    // Delete note through service
    await noteService.deleteNote(noteId, userId);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
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
 * Reorder notes within a module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const reorderNotes = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const moduleId = req.body.moduleId;
    const orderData = req.body.order;

    // Validate order data
    if (!Array.isArray(orderData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data format'
      });
    }

    // Reorder notes through service
    await noteService.reorderNotes(moduleId, userId, orderData);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Notes reordered successfully'
    });
  } catch (error) {
    if (error.message === 'Module not found' || error.message === 'Unauthorized access to module') {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    next(error);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  reorderNotes
};