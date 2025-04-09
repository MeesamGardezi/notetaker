/**
 * Tier Service
 * Handles user account tier management, tier limitations, and related operations
 */

const { admin, db } = require('../config/firebase-admin');
const config = require('../config/config');

/**
 * Get all available tiers with their features and limitations
 * @returns {Object} - Available tiers information
 */
const getAvailableTiers = () => {
  return config.tiers;
};

/**
 * Get user's current tier information
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User tier information with usage statistics
 */
const getUserTier = async (userId) => {
  try {
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const tierName = userData.accountTier;
    const tierConfig = config.tiers[tierName];
    
    if (!tierConfig) {
      throw new Error('Invalid tier configuration');
    }
    
    // Calculate usage percentages
    const moduleUsagePercent = tierConfig.maxModules === Infinity 
      ? 0 
      : (userData.moduleCount / tierConfig.maxModules) * 100;
    
    const storageUsagePercent = (userData.storageUsed / tierConfig.maxStorage) * 100;
    
    // Get notes per module statistics
    const moduleSnapshot = await db.collection('modules')
      .where('userId', '==', userId)
      .get();
    
    const modulesStats = [];
    
    moduleSnapshot.forEach(doc => {
      const moduleData = doc.data();
      const notesUsagePercent = tierConfig.maxNotesPerModule === Infinity 
        ? 0 
        : (moduleData.noteCount / tierConfig.maxNotesPerModule) * 100;
      
      modulesStats.push({
        id: doc.id,
        name: moduleData.name,
        noteCount: moduleData.noteCount,
        maxNotes: tierConfig.maxNotesPerModule,
        usagePercent: notesUsagePercent
      });
    });
    
    return {
      tier: tierName,
      features: tierConfig.features,
      limits: {
        modules: {
          current: userData.moduleCount,
          max: tierConfig.maxModules,
          usagePercent: moduleUsagePercent
        },
        storage: {
          current: userData.storageUsed,
          max: tierConfig.maxStorage,
          usagePercent: storageUsagePercent,
          currentFormatted: formatBytes(userData.storageUsed),
          maxFormatted: formatBytes(tierConfig.maxStorage)
        },
        notesPerModule: {
          max: tierConfig.maxNotesPerModule,
          modulesStats
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a user can create a new module based on their tier
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether user can create a module
 */
const canCreateModule = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const tierConfig = config.tiers[userData.accountTier];
    
    return userData.moduleCount < tierConfig.maxModules;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a user can create a new note in a module based on their tier
 * @param {string} userId - User ID
 * @param {string} moduleId - Module ID
 * @returns {Promise<boolean>} - Whether user can create a note
 */
const canCreateNote = async (userId, moduleId) => {
  try {
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const tierConfig = config.tiers[userData.accountTier];
    
    // Get module document
    const moduleDoc = await db.collection('modules').doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      throw new Error('Module not found');
    }
    
    const moduleData = moduleDoc.data();
    
    // Check if user owns the module
    if (moduleData.userId !== userId) {
      throw new Error('Unauthorized access to module');
    }
    
    return moduleData.noteCount < tierConfig.maxNotesPerModule;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a user can upload a file of a given size based on their tier
 * @param {string} userId - User ID
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<boolean>} - Whether user can upload the file
 */
const canUploadFile = async (userId, fileSize) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const tierConfig = config.tiers[userData.accountTier];
    
    // Check if the file itself is too large
    if (fileSize > config.upload.maxFileSize) {
      return false;
    }
    
    // Check if adding this file would exceed storage limit
    return (userData.storageUsed + fileSize) <= tierConfig.maxStorage;
  } catch (error) {
    throw error;
  }
};

/**
 * Upgrade user to a new tier
 * @param {string} userId - User ID
 * @param {string} tierName - New tier name
 * @returns {Promise<Object>} - Updated user tier information
 */
const upgradeTier = async (userId, tierName) => {
  try {
    // Validate tier exists
    if (!config.tiers[tierName]) {
      throw new Error('Invalid tier');
    }
    
    // Get user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    // Update user's tier
    await userRef.update({
      accountTier: tierName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return updated tier info
    return getUserTier(userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Utility function to format bytes into a human-readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places
 * @returns {string} - Formatted string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

module.exports = {
  getAvailableTiers,
  getUserTier,
  canCreateModule,
  canCreateNote,
  canUploadFile,
  upgradeTier
};