/**
 * Tier Limits
 * Utility functions for working with tier limitations
 */

const config = require('../config/config');

/**
 * Get tier configuration by tier name
 * @param {string} tierName - Name of the tier
 * @returns {Object|null} - Tier configuration or null if not found
 */
const getTierConfig = (tierName) => {
  return config.tiers[tierName] || null;
};

/**
 * Check if user is at module limit for their tier
 * @param {Object} userData - User data
 * @returns {boolean} - Whether user is at limit
 */
const isAtModuleLimit = (userData) => {
  const tierConfig = getTierConfig(userData.accountTier);
  
  if (!tierConfig) {
    return true; // If tier not found, consider at limit
  }
  
  return userData.moduleCount >= tierConfig.maxModules;
};

/**
 * Check if module is at note limit for user's tier
 * @param {Object} moduleData - Module data
 * @param {Object} userData - User data
 * @returns {boolean} - Whether module is at limit
 */
const isAtNoteLimit = (moduleData, userData) => {
  const tierConfig = getTierConfig(userData.accountTier);
  
  if (!tierConfig) {
    return true; // If tier not found, consider at limit
  }
  
  return moduleData.noteCount >= tierConfig.maxNotesPerModule;
};

/**
 * Check if adding a file would exceed storage limit
 * @param {Object} userData - User data
 * @param {number} fileSize - Size of the file in bytes
 * @returns {boolean} - Whether adding file would exceed limit
 */
const wouldExceedStorageLimit = (userData, fileSize) => {
  const tierConfig = getTierConfig(userData.accountTier);
  
  if (!tierConfig) {
    return true; // If tier not found, consider at limit
  }
  
  return (userData.storageUsed + fileSize) > tierConfig.maxStorage;
};

/**
 * Get remaining quota for modules
 * @param {Object} userData - User data
 * @returns {Object} - Remaining quota information
 */
const getRemainingModuleQuota = (userData) => {
  const tierConfig = getTierConfig(userData.accountTier);
  
  if (!tierConfig) {
    return {
      remaining: 0,
      total: 0,
      isAtLimit: true
    };
  }
  
  const remaining = tierConfig.maxModules - userData.moduleCount;
  
  return {
    remaining: tierConfig.maxModules === Infinity ? -1 : remaining,
    total: tierConfig.maxModules === Infinity ? -1 : tierConfig.maxModules,
    isAtLimit: isAtModuleLimit(userData)
  };
};

/**
 * Get remaining quota for notes in a module
 * @param {Object} moduleData - Module data
 * @param {Object} userData - User data
 * @returns {Object} - Remaining quota information
 */
const getRemainingNoteQuota = (moduleData, userData) => {
  const tierConfig = getTierConfig(userData.accountTier);
  
  if (!tierConfig) {
    return {
      remaining: 0,
      total: 0,
      isAtLimit: true
    };
  }
  
  const remaining = tierConfig.maxNotesPerModule - moduleData.noteCount;
  
  return {
    remaining: tierConfig.maxNotesPerModule === Infinity ? -1 : remaining,
    total: tierConfig.maxNotesPerModule === Infinity ? -1 : tierConfig.maxNotesPerModule,
    isAtLimit: isAtNoteLimit(moduleData, userData)
  };
};

/**
 * Get remaining storage quota
 * @param {Object} userData - User data
 * @returns {Object} - Remaining quota information
 */
const getRemainingStorageQuota = (userData) => {
  const tierConfig = getTierConfig(userData.accountTier);
  
  if (!tierConfig) {
    return {
      remaining: 0,
      total: 0,
      used: userData.storageUsed,
      percentUsed: 100,
      isAtLimit: true
    };
  }
  
  const remaining = tierConfig.maxStorage - userData.storageUsed;
  const percentUsed = (userData.storageUsed / tierConfig.maxStorage) * 100;
  
  return {
    remaining,
    total: tierConfig.maxStorage,
    used: userData.storageUsed,
    percentUsed,
    isAtLimit: remaining <= 0
  };
};

/**
 * Format storage size to human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted size
 */
const formatStorageSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if a feature is available for a tier
 * @param {string} feature - Feature name
 * @param {string} tierName - Tier name
 * @returns {boolean} - Whether feature is available
 */
const isFeatureAvailable = (feature, tierName) => {
  const tierConfig = getTierConfig(tierName);
  
  if (!tierConfig || !tierConfig.features) {
    return false;
  }
  
  return tierConfig.features.includes(feature);
};

module.exports = {
  getTierConfig,
  isAtModuleLimit,
  isAtNoteLimit,
  wouldExceedStorageLimit,
  getRemainingModuleQuota,
  getRemainingNoteQuota,
  getRemainingStorageQuota,
  formatStorageSize,
  isFeatureAvailable
};