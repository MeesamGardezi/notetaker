/**
 * User Service
 * Handles user profile operations and related functionality
 */

const { admin, auth, db } = require('../config/firebase.config').getFirebaseServices();

/**
 * Get user profile data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
const getUserProfile = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    if (userData.status === 'deleted') {
      throw new Error('User account has been deleted');
    }
    
    return {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      accountTier: userData.accountTier,
      status: userData.status,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt,
      moduleCount: userData.moduleCount,
      noteCount: userData.noteCount,
      storageUsed: userData.storageUsed
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated profile data
 */
const updateProfile = async (userId, profileData) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    if (userData.status === 'deleted') {
      throw new Error('User account has been deleted');
    }
    
    // Prepare update object
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Only update allowed fields
    if (profileData.displayName !== undefined) {
      updateData.displayName = profileData.displayName;
      
      // Also update in Firebase Auth
      await auth.updateUser(userId, {
        displayName: profileData.displayName
      });
    }
    
    if (profileData.photoURL !== undefined) {
      updateData.photoURL = profileData.photoURL;
      
      // Also update in Firebase Auth
      await auth.updateUser(userId, {
        photoURL: profileData.photoURL
      });
    }
    
    // Update in Firestore
    await userRef.update(updateData);
    
    // Get updated profile
    return getUserProfile(userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user account (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const deleteUser = async (userId) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    // Soft delete by updating status
    await userRef.update({
      status: 'deleted',
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // In a production environment, you might also:
    // 1. Schedule hard deletion for later
    // 2. Delete or anonymize sensitive data
    // 3. Revoke tokens or sessions
  } catch (error) {
    throw error;
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} - User data
 */
const getUserByEmail = async (email) => {
  try {
    // Get user from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found in database');
    }
    
    const userData = userDoc.data();
    
    if (userData.status === 'deleted') {
      throw new Error('User account has been deleted');
    }
    
    return {
      uid: userRecord.uid,
      ...userData
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update user activity timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const updateActivity = async (userId) => {
  try {
    await db.collection('users').doc(userId).update({
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    // Log error but don't throw, as this is a non-critical operation
    console.error('Error updating user activity:', error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  deleteUser,
  getUserByEmail,
  updateActivity
};