/**
 * Tier Service
 * Handles user tier management and limitations
 */

const { admin, db } = require('../config/firebase.config').getFirebaseServices();
const tierConfig = require('../config/tier.config');

/**
 * Get all available tiers
 * @returns {Object} - Available tiers
 */
const getAvailableTiers = () => {
  return tierConfig.tiers;
};

/**
 * Get user's current tier
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User tier information
 */
const getUserTier = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const tierName = userData.accountTier;
    const tier = tierConfig.tiers[tierName];
    
    if (!tier) {
      throw new Error('Invalid tier configuration');
    }
    
    // Calculate usage percentages
    const moduleUsagePercent = tier.maxModules === Infinity 
      ? 0 
      : (userData.moduleCount / tier.maxModules) * 100;
    
    const storageUsagePercent = (userData.storageUsed / tier.maxStorage) * 100;
    
    // Get notes per module statistics
    const modulesSnapshot = await db.collection('modules')
      .where('userId', '==', userId)
      .get();
    
    const modulesStats = [];
    
    modulesSnapshot.forEach(doc => {
      const moduleData = doc.data();
      const notesUsagePercent = tier.maxNotesPerModule === Infinity 
        ? 0 
        : (moduleData.noteCount / tier.maxNotesPerModule) * 100;
      
      modulesStats.push({
        id: doc.id,
        name: moduleData.name,
        noteCount: moduleData.noteCount,
        maxNotes: tier.maxNotesPerModule,
        usagePercent: notesUsagePercent
      });
    });
    
    // Return tier information with readable limits
    return {
      tier: tierName,
      tierInfo: tierConfig.getReadableLimits(tierName),
      features: tier.features,
      limits: {
        modules: {
          current: userData.moduleCount,
          max: tier.maxModules,
          usagePercent: moduleUsagePercent
        },
        storage: {
          current: userData.storageUsed,
          max: tier.maxStorage,
          usagePercent: storageUsagePercent,
          currentFormatted: tierConfig.formatStorageSize(userData.storageUsed),
          maxFormatted: tierConfig.formatStorageSize(tier.maxStorage)
        },
        notesPerModule: {
          max: tier.maxNotesPerModule,
          modulesStats
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user can create a module
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
    const tier = tierConfig.tiers[userData.accountTier];
    
    return userData.moduleCount < tier.maxModules;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user can create a note in a module
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
    const tier = tierConfig.tiers[userData.accountTier];
    
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
    
    return moduleData.noteCount < tier.maxNotesPerModule;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user can upload a file
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
    const tier = tierConfig.tiers[userData.accountTier];
    
    // Check if adding this file would exceed storage limit
    return (userData.storageUsed + fileSize) <= tier.maxStorage;
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
    if (!tierConfig.tiers[tierName]) {
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

module.exports = {
  getAvailableTiers,
  getUserTier,
  canCreateModule,
  canCreateNote,
  canUploadFile,
  upgradeTier
};