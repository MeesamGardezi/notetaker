/**
 * Module Service
 * Handles operations related to modules (top-level organizational units)
 */

const { admin, db } = require('../config/firebase.config').getFirebaseServices();
const config = require('../config/app.config');
const tierConfig = require('../config/tier.config');

/**
 * Create a new module
 * @param {string} userId - User ID
 * @param {Object} moduleData - Module data (name, description, color)
 * @returns {Promise<Object>} - Created module data
 */
const createModule = async (userId, moduleData) => {
  try {
    // Get user document to check tier limits and update counter
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Check if user is at module limit based on their tier
    const tier = tierConfig.tiers[userData.accountTier];
    if (userData.moduleCount >= tier.maxModules) {
      throw new Error(`Maximum number of modules (${tier.maxModules}) reached for your account tier`);
    }
    
    // Get position for new module (count + 1)
    const position = userData.moduleCount + 1;
    
    // Create module document
    const moduleRef = db.collection('modules').doc();
    const newModule = {
      name: moduleData.name,
      description: moduleData.description || '',
      color: moduleData.color || '#3498db',
      position,
      userId,
      noteCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Use a transaction to create module and update user's module count
    await db.runTransaction(async (transaction) => {
      transaction.set(moduleRef, newModule);
      transaction.update(userRef, {
        moduleCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    return {
      id: moduleRef.id,
      ...newModule,
      createdAt: new Date(), // Convert server timestamp to date for immediate use
      updatedAt: new Date()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all modules for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of modules
 */
const getUserModules = async (userId) => {
  try {
    const modulesSnapshot = await db.collection('modules')
      .where('userId', '==', userId)
      .orderBy('position', 'asc')
      .get();
    
    if (modulesSnapshot.empty) {
      return [];
    }
    
    const modules = [];
    modulesSnapshot.forEach((doc) => {
      modules.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return modules;
  } catch (error) {
    throw error;
  }
};

/**
 * Get module by ID
 * @param {string} moduleId - Module ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Module data
 */
const getModuleById = async (moduleId, userId) => {
  try {
    const moduleDoc = await db.collection('modules').doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      throw new Error('Module not found');
    }
    
    const moduleData = moduleDoc.data();
    
    // Check if module belongs to the user
    if (moduleData.userId !== userId) {
      throw new Error('Unauthorized access to module');
    }
    
    return {
      id: moduleDoc.id,
      ...moduleData
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update a module
 * @param {string} moduleId - Module ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} updateData - Module data to update
 * @returns {Promise<Object>} - Updated module data
 */
const updateModule = async (moduleId, userId, updateData) => {
  try {
    const moduleRef = db.collection('modules').doc(moduleId);
    const moduleDoc = await moduleRef.get();
    
    if (!moduleDoc.exists) {
      throw new Error('Module not found');
    }
    
    const moduleData = moduleDoc.data();
    
    // Check if module belongs to the user
    if (moduleData.userId !== userId) {
      throw new Error('Unauthorized access to module');
    }
    
    // Prepare update object (only allow certain fields to be updated)
    const update = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (updateData.name !== undefined) update.name = updateData.name;
    if (updateData.description !== undefined) update.description = updateData.description;
    if (updateData.color !== undefined) update.color = updateData.color;
    
    // Update the module
    await moduleRef.update(update);
    
    // Return updated module data
    const updatedModule = {
      id: moduleId,
      ...moduleData,
      ...update,
      updatedAt: new Date() // Convert server timestamp to date for immediate use
    };
    
    // Remove server timestamp for client use
    delete updatedModule.serverTimestamp;
    
    return updatedModule;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a module
 * @param {string} moduleId - Module ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<void>}
 */
const deleteModule = async (moduleId, userId) => {
  try {
    // Get references
    const moduleRef = db.collection('modules').doc(moduleId);
    const userRef = db.collection('users').doc(userId);
    
    // Get module document
    const moduleDoc = await moduleRef.get();
    
    if (!moduleDoc.exists) {
      throw new Error('Module not found');
    }
    
    const moduleData = moduleDoc.data();
    
    // Check if module belongs to the user
    if (moduleData.userId !== userId) {
      throw new Error('Unauthorized access to module');
    }
    
    // Get all notes in this module
    const notesSnapshot = await db.collection('notes')
      .where('moduleId', '==', moduleId)
      .get();
    
    // Use a transaction to delete module, all its notes, and update user counters
    await db.runTransaction(async (transaction) => {
      // Delete all notes in the module
      notesSnapshot.forEach(doc => {
        transaction.delete(doc.ref);
      });
      
      // Delete the module
      transaction.delete(moduleRef);
      
      // Update user counters
      transaction.update(userRef, {
        moduleCount: admin.firestore.FieldValue.increment(-1),
        noteCount: admin.firestore.FieldValue.increment(-notesSnapshot.size),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Reorder modules
 * @param {string} userId - User ID
 * @param {Array<{id: string, position: number}>} orderData - Array of module IDs and positions
 * @returns {Promise<void>}
 */
const reorderModules = async (userId, orderData) => {
  try {
    // Validate input
    if (!Array.isArray(orderData)) {
      throw new Error('Invalid order data format');
    }
    
    // Create batch for multiple updates
    const batch = db.batch();
    
    // Update position for each module
    for (const item of orderData) {
      const { id, position } = item;
      const moduleRef = db.collection('modules').doc(id);
      
      // Verify module belongs to user before adding to batch
      const moduleDoc = await moduleRef.get();
      if (!moduleDoc.exists || moduleDoc.data().userId !== userId) {
        throw new Error(`Unauthorized access to module: ${id}`);
      }
      
      batch.update(moduleRef, {
        position,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Commit the batch
    await batch.commit();
  } catch (error) {
    throw error;
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