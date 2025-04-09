/**
 * Module Controller
 * Handles HTTP requests related to module management
 */

const moduleService = require('../services/module.service');
const tierService = require('../services/tier.service');
const { validationResult } = require('express-validator');

/**
 * Create a new module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createModule = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const moduleData = req.body;

    // Check tier limitations
    const canCreate = await tierService.canCreateModule(userId);
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'Module limit reached for your account tier'
      });
    }

    // Create module through service
    const newModule = await moduleService.createModule(userId, moduleData);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: newModule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user modules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserModules = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get modules through service
    const modules = await moduleService.getUserModules(userId);

    // Return modules
    res.status(200).json({
      success: true,
      data: {
        modules,
        count: modules.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get module by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getModuleById = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const moduleId = req.params.id;

    // Get module through service
    const module = await moduleService.getModuleById(moduleId, userId);

    // Return module
    res.status(200).json({
      success: true,
      data: module
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
 * Update module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateModule = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const moduleId = req.params.id;
    const updateData = req.body;

    // Update module through service
    const updatedModule = await moduleService.updateModule(moduleId, userId, updateData);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: updatedModule
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
 * Delete module
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteModule = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const moduleId = req.params.id;

    // Delete module through service
    await moduleService.deleteModule(moduleId, userId);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Module deleted successfully'
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
 * Reorder modules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const reorderModules = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.uid;
    const orderData = req.body.order;

    // Validate order data
    if (!Array.isArray(orderData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data format'
      });
    }

    // Reorder modules through service
    await moduleService.reorderModules(userId, orderData);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Modules reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createModule,
  getUserModules,
  getModuleById,
  updateModule,
  deleteModule,
  reorderModules
};