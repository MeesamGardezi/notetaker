/**
 * Module Controller
 * Handles module CRUD operations
 */

const { collections, Timestamp, FieldValue } = require('../config/firebase');

/**
 * Create a new module
 */
exports.createModule = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { title, description, color, icon } = req.body;

    // Check user tier limits
    if (req.tierLimits && !req.tierLimits.canCreateModule) {
      return res.status(403).json({ 
        error: 'You have reached the maximum number of modules for your tier' 
      });
    }

    // Create new module
    const newModule = {
      userId,
      title,
      description: description || null,
      color: color || null,
      icon: icon || null,
      sortOrder: Date.now(), // Use timestamp for default sorting
      isArchived: false,
      noteCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add module to Firestore
    const moduleRef = await collections.modules.add(newModule);
    
    // Return created module
    res.status(201).json({
      message: 'Module created successfully',
      module: {
        id: moduleRef.id,
        ...newModule,
        createdAt: newModule.createdAt.toMillis(),
        updatedAt: newModule.updatedAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all modules for user
 */
exports.getModules = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { includeArchived } = req.query;

    // Simple query - only filter by userId
    const modulesSnapshot = await collections.modules
      .where('userId', '==', userId)
      .get();
    
    let modules = modulesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis()
      };
    });
    
    // Filter archived modules in memory if needed
    if (includeArchived !== 'true') {
      modules = modules.filter(module => module.isArchived === false);
    }
    
    // Sort by sortOrder in memory
    modules.sort((a, b) => a.sortOrder - b.sortOrder);

    res.status(200).json({ modules });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single module by ID
 */
exports.getModule = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleId } = req.params;

    // Get module
    const moduleDoc = await collections.modules.doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      return res.status(404).json({ 
        error: 'Module not found' 
      });
    }

    const moduleData = moduleDoc.data();
    
    // Check ownership
    if (moduleData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this module' 
      });
    }

    // Return module data
    res.status(200).json({
      module: {
        id: moduleDoc.id,
        ...moduleData,
        createdAt: moduleData.createdAt.toMillis(),
        updatedAt: moduleData.updatedAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a module
 */
exports.updateModule = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleId } = req.params;
    const { title, description, color, icon, sortOrder, isArchived } = req.body;

    // Get module
    const moduleDoc = await collections.modules.doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      return res.status(404).json({ 
        error: 'Module not found' 
      });
    }

    const moduleData = moduleDoc.data();
    
    // Check ownership
    if (moduleData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to update this module' 
      });
    }

    // Build update object
    const updateData = {
      updatedAt: Timestamp.now()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    // Update module
    await moduleDoc.ref.update(updateData);

    // Get updated module
    const updatedModuleDoc = await collections.modules.doc(moduleId).get();
    const updatedModuleData = updatedModuleDoc.data();

    // Return updated module
    res.status(200).json({
      message: 'Module updated successfully',
      module: {
        id: updatedModuleDoc.id,
        ...updatedModuleData,
        createdAt: updatedModuleData.createdAt.toMillis(),
        updatedAt: updatedModuleData.updatedAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a module
 */
exports.deleteModule = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleId } = req.params;

    // Get module
    const moduleDoc = await collections.modules.doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      return res.status(404).json({ 
        error: 'Module not found' 
      });
    }

    const moduleData = moduleDoc.data();
    
    // Check ownership
    if (moduleData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this module' 
      });
    }

    // Start a batch operation
    const batch = collections.db.batch();
    
    // Get all notes for this module with a simple query
    const notesSnapshot = await collections.notes
      .where('moduleId', '==', moduleId)
      .get();
    
    // Delete all notes in the module
    notesSnapshot.docs.forEach(noteDoc => {
      batch.delete(noteDoc.ref);
    });
    
    // Delete the module
    batch.delete(moduleDoc.ref);
    
    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: 'Module and all associated notes deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder modules
 */
exports.reorderModules = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleIds } = req.body; // Array of moduleIds in the new order

    if (!Array.isArray(moduleIds)) {
      return res.status(400).json({ 
        error: 'moduleIds must be an array' 
      });
    }

    // Start a batch operation
    const batch = collections.db.batch();
    
    // Apply sort order for each module
    moduleIds.forEach((moduleId, index) => {
      const moduleRef = collections.modules.doc(moduleId);
      batch.update(moduleRef, { 
        sortOrder: index,
        updatedAt: Timestamp.now()
      });
    });
    
    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: 'Modules reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};