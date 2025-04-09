/**
 * Tier Routes
 */

const express = require('express');
const { body, query } = require('express-validator');
const tierController = require('../controllers/tier.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../middleware/error.middleware');

const router = express.Router();

// Get available tiers (public route)
router.route('/available')
  .get(tierController.getAvailableTiers)
  .all(methodNotAllowed(['GET']));

// Apply authentication middleware to all other routes
router.use(verifyToken);

// Get user's current tier information
router.route('/current')
  .get(tierController.getUserTier)
  .all(methodNotAllowed(['GET']));

// Upgrade user to a new tier
router.route('/upgrade')
  .post([
    body('tierName')
      .notEmpty()
      .withMessage('Tier name is required')
  ], tierController.upgradeTier)
  .all(methodNotAllowed(['POST']));

// Check if user can create a module
router.route('/check-module-creation')
  .get(tierController.checkModuleCreation)
  .all(methodNotAllowed(['GET']));

// Check if user can create a note in a module
router.route('/check-note-creation/:moduleId')
  .get(tierController.checkNoteCreation)
  .all(methodNotAllowed(['GET']));

// Check if user can upload a file
router.route('/check-file-upload')
  .get([
    query('fileSize')
      .isInt({ min: 1 })
      .withMessage('Valid file size is required')
  ], tierController.checkFileUpload)
  .all(methodNotAllowed(['GET']));

module.exports = router;