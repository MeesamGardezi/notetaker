/**
 * Storage Service
 * Handles storage operations and utilities
 */

const { admin, db, storage } = require('../config/firebase.config').getFirebaseServices();

/**
 * Get user storage statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Storage statistics
 */
const getUserStorageStats = async (userId) => {
  try {
    // Get user storage directory reference
    const userStoragePrefix = `users/${userId}/`;
    
    // List all files in user storage
    const [files] = await storage.bucket().getFiles({
      prefix: userStoragePrefix
    });
    
    // Calculate total size and count files by type
    let totalSize = 0;
    const fileTypes = {};
    const fileList = [];
    
    for (const file of files) {
      // Get metadata
      const [metadata] = await file.getMetadata();
      const fileSize = parseInt(metadata.size, 10) || 0;
      totalSize += fileSize;
      
      // Determine file type from content type
      const contentType = metadata.contentType || 'unknown';
      const type = contentType.split('/')[0] || 'unknown';
      
      // Count files by type
      fileTypes[type] = (fileTypes[type] || 0) + 1;
      
      // Add to file list if not too many (to avoid return payload being too large)
      if (fileList.length < 100) { // Limit to 100 files
        fileList.push({
          path: file.name,
          size: fileSize,
          contentType: contentType,
          updated: metadata.updated
        });
      }
    }
    
    return {
      totalSize,
      fileCount: files.length,
      fileTypes,
      fileList
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Clean up orphaned files (files not referenced in any note)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Cleanup results
 */
const cleanupOrphanedFiles = async (userId) => {
  try {
    // Get all notes for the user
    const notesSnapshot = await db.collection('notes')
      .where('userId', '==', userId)
      .get();
    
    // Create a map of valid storage paths
    const validStoragePaths = new Set();
    notesSnapshot.forEach(doc => {
      const noteData = doc.data();
      if (noteData.mediaFiles && Array.isArray(noteData.mediaFiles)) {
        noteData.mediaFiles.forEach(file => {
          if (file.storagePath) {
            validStoragePaths.add(file.storagePath);
          }
        });
      }
    });
    
    // Get all files in user storage
    const userStoragePrefix = `users/${userId}/`;
    const [files] = await storage.bucket().getFiles({
      prefix: userStoragePrefix
    });
    
    // Identify orphaned files
    const orphanedFiles = files.filter(file => !validStoragePaths.has(file.name));
    
    // Delete orphaned files
    let deletedCount = 0;
    let totalSizeRecovered = 0;
    
    for (const file of orphanedFiles) {
      try {
        // Get file size
        const [metadata] = await file.getMetadata();
        const fileSize = parseInt(metadata.size, 10) || 0;
        
        // Delete file
        await file.delete();
        
        deletedCount++;
        totalSizeRecovered += fileSize;
      } catch (error) {
        console.error(`Failed to delete file ${file.name}:`, error);
      }
    }
    
    return {
      deletedCount,
      totalSizeRecovered
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Upload file to storage
 * @param {string} userId - User ID
 * @param {string} folderPath - Folder path
 * @param {string} filename - Filename
 * @param {Buffer} buffer - File buffer
 * @param {Object} metadata - File metadata
 * @returns {Promise<Object>} - Uploaded file information
 */
const uploadFile = async (userId, folderPath, filename, buffer, metadata = {}) => {
  try {
    // Define the file path in Firebase Storage
    const storagePath = `users/${userId}/${folderPath}/${filename}`;
    const file = storage.bucket().file(storagePath);
    
    // Upload the file
    await file.save(buffer, {
      metadata: {
        contentType: metadata.contentType || 'application/octet-stream',
        metadata: {
          ...metadata,
          userId
        }
      }
    });
    
    // Get signed URL for the file (valid for 7 days)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return {
      filename,
      storagePath,
      size: buffer.length,
      url,
      contentType: metadata.contentType || 'application/octet-stream'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete file from storage
 * @param {string} storagePath - Storage path
 * @returns {Promise<void>}
 */
const deleteFile = async (storagePath) => {
  try {
    const file = storage.bucket().file(storagePath);
    await file.delete();
  } catch (error) {
    throw error;
  }
};

/**
 * Get signed URL for a file
 * @param {string} storagePath - Storage path
 * @param {number} expirationMs - Expiration time in milliseconds
 * @returns {Promise<string>} - Signed URL
 */
const getFileUrl = async (storagePath, expirationMs = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const file = storage.bucket().file(storagePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found');
    }
    
    // Generate signed URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expirationMs
    });
    
    return url;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserStorageStats,
  cleanupOrphanedFiles,
  uploadFile,
  deleteFile,
  getFileUrl
};