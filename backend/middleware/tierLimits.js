/**
 * Tier Limits Middleware
 * Enforces limitations based on user's subscription tier
 */

const { collections } = require('../config/firebase');

// Define tier limits
const TIER_LIMITS = {
  free: {
    maxModules: 2,
    maxNotesPerModule: 10,
    maxImageSizeBytes: 5 * 1024 * 1024, // 5MB
    maxTags: 20
  },
  premium: {
    maxModules: Infinity,
    maxNotesPerModule: Infinity,
    maxImageSizeBytes: 50 * 1024 * 1024, // 50MB
    maxTags: Infinity
  }
};

/**
 * Check module creation limits
 */
exports.checkModuleLimits = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get user document to check tier
    const userDoc = await collections.users.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const tierLimits = TIER_LIMITS[userData.tier] || TIER_LIMITS.free;

    // Count existing modules
    const modulesSnapshot = await collections.modules
      .where('userId', '==', userId)
      .count()
      .get();
    
    const moduleCount = modulesSnapshot.data().count;

    // Check if limit is reached
    req.tierLimits = {
      canCreateModule: moduleCount < tierLimits.maxModules,
      moduleCount,
      maxModules: tierLimits.maxModules
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check note creation limits
 */
exports.checkNoteLimits = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleId } = req.body;

    // Get user document to check tier
    const userDoc = await collections.users.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const tierLimits = TIER_LIMITS[userData.tier] || TIER_LIMITS.free;

    // Get module document to check note count
    const moduleDoc = await collections.modules.doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const moduleData = moduleDoc.data();
    
    // Check if user owns the module
    if (moduleData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this module' 
      });
    }

    // Check if note limit is reached
    req.tierLimits = {
      canCreateNote: moduleData.noteCount < tierLimits.maxNotesPerModule,
      noteCount: moduleData.noteCount,
      maxNotesPerModule: tierLimits.maxNotesPerModule
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check note move limits
 */
exports.checkNoteMoveLimit = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleId } = req.body;
    
    // If not changing module, skip this check
    if (!moduleId) {
      return next();
    }

    // Get user document to check tier
    const userDoc = await collections.users.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const tierLimits = TIER_LIMITS[userData.tier] || TIER_LIMITS.free;

    // Get target module document to check note count
    const moduleDoc = await collections.modules.doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const moduleData = moduleDoc.data();
    
    // Check if user owns the module
    if (moduleData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this module' 
      });
    }

    // Check if note limit is reached
    req.tierLimits = {
      canMoveNote: moduleData.noteCount < tierLimits.maxNotesPerModule,
      noteCount: moduleData.noteCount,
      maxNotesPerModule: tierLimits.maxNotesPerModule
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check tag creation limits
 */
exports.checkTagLimits = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get user document to check tier
    const userDoc = await collections.users.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const tierLimits = TIER_LIMITS[userData.tier] || TIER_LIMITS.free;

    // Count existing tags
    const tagsSnapshot = await collections.tags
      .where('userId', '==', userId)
      .count()
      .get();
    
    const tagCount = tagsSnapshot.data().count;

    // Check if limit is reached
    req.tierLimits = {
      canCreateTag: tagCount < tierLimits.maxTags,
      tagCount,
      maxTags: tierLimits.maxTags
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check image upload limits
 */
exports.checkImageLimits = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Get user document to check tier
    const userDoc = await collections.users.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const tierLimits = TIER_LIMITS[userData.tier] || TIER_LIMITS.free;

    // Add image size check function to req.tierLimits
    req.tierLimits = {
      canUploadImage: (fileSize) => fileSize <= tierLimits.maxImageSizeBytes,
      maxImageSize: tierLimits.maxImageSizeBytes
    };

    next();
  } catch (error) {
    next(error);
  }
};