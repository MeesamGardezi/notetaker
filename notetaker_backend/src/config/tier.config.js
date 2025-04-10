/**
 * Tier Configuration
 * Defines user tiers and their limitations
 */

// Free tier limitations
const freeTier = {
    name: 'free',
    maxModules: 2,
    maxNotesPerModule: 10,
    maxStorage: 52428800, // 50MB in bytes
    features: ['basic_editor']
  };
  
  // Pro tier limitations
  const proTier = {
    name: 'pro',
    maxModules: Infinity, // Unlimited
    maxNotesPerModule: Infinity, // Unlimited
    maxStorage: 5368709120, // 5GB in bytes
    features: [
      'basic_editor',
      'advanced_editor',
      'export',
      'offline_access',
      'collaboration'
    ]
  };
  
  // All available tiers
  const tiers = {
    free: freeTier,
    pro: proTier
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
   * Get human readable tier limits
   * @param {string} tierName - Name of the tier
   * @returns {Object} - Human readable limits
   */
  const getReadableLimits = (tierName) => {
    const tier = tiers[tierName];
    
    if (!tier) {
      return null;
    }
    
    return {
      name: tier.name,
      modules: tier.maxModules === Infinity ? 'Unlimited' : tier.maxModules,
      notesPerModule: tier.maxNotesPerModule === Infinity ? 'Unlimited' : tier.maxNotesPerModule,
      storage: formatStorageSize(tier.maxStorage),
      features: tier.features
    };
  };
  
  module.exports = {
    tiers,
    getReadableLimits,
    formatStorageSize
  };