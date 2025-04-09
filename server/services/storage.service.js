/**
 * Storage Service
 * Handles general storage operations and utilities for Firebase Storage
 */

const { admin, storage } = require('../config/firebase-admin');
const path = require('path');
const crypto = require('crypto');

/**
 * Get user storage usage statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Storage usage statistics
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
    
    files.forEach(file => {
      const fileSize = parseInt(file.metadata.size, 10) || 0;
      totalSize += fileSize;
      
      // Determine file type from content type
      const contentType = file.metadata.contentType || 'unknown';
      const type = contentType.split('/')[0] || 'unknown';
      
      // Count files by type
      fileTypes[type] = (fileTypes[type] || 0) + 1;
      
      // Add to file list
      fileList.push({
        path: file.name,
        size: fileSize,
        contentType: contentType,
        updated: file.metadata.updated
      });
    });
    
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
 * Generate a signed URL for a file
 * @param {string} filePath - Path to the file in storage
 * @param {number} expirationTime - Expiration time in milliseconds
 * @returns {Promise<string>} - Signed URL
 */
const getSignedUrl = async (filePath, expirationTime = 3600000) => {
  try {
    const fileRef = storage.bucket().file(filePath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      throw new Error('File not found');
    }
    
    // Generate signed URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + expirationTime
    });
    
    return url;
  } catch (error) {
    throw error;
  }
};

/**
 * Copy a file to a new location
 * @param {string} sourcePath - Source file path
 * @param {string} destinationPath - Destination file path
 * @returns {Promise<Object>} - Destination file information
 */
const copyFile = async (sourcePath, destinationPath) => {
  try {
    const sourceFile = storage.bucket().file(sourcePath);
    
    // Check if source file exists
    const [exists] = await sourceFile.exists();
    if (!exists) {
      throw new Error('Source file not found');
    }
    
    // Copy the file
    const [destinationFile] = await sourceFile.copy(destinationPath);
    
    // Get destination file metadata
    const [metadata] = await destinationFile.getMetadata();
    
    return {
      path: destinationPath,
      size: parseInt(metadata.size, 10) || 0,
      contentType: metadata.contentType,
      updated: metadata.updated
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Move a file to a new location
 * @param {string} sourcePath - Source file path
 * @param {string} destinationPath - Destination file path
 * @returns {Promise<Object>} - Destination file information
 */
const moveFile = async (sourcePath, destinationPath) => {
  try {
    // Copy the file to the new location
    const fileInfo = await copyFile(sourcePath, destinationPath);
    
    // Delete the source file
    await deleteFile(sourcePath);
    
    return fileInfo;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a file
 * @param {string} filePath - Path to the file in storage
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
  try {
    const fileRef = storage.bucket().file(filePath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      throw new Error('File not found');
    }
    
    // Delete the file
    await fileRef.delete();
  } catch (error) {
    throw error;
  }
};

/**
 * Generate a unique filename
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const fileExtension = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${fileExtension}`;
};

/**
 * Clean up orphaned files
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Cleanup results
 */
const cleanupOrphanedFiles = async (userId) => {
  try {
    // Get all notes for the user
    const notesSnapshot = await admin.firestore().collection('notes')
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
      const fileSize = parseInt(file.metadata.size, 10) || 0;
      await file.delete();
      deletedCount++;
      totalSizeRecovered += fileSize;
    }
    
    return {
      deletedCount,
      totalSizeRecovered
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserStorageStats,
  getSignedUrl,
  copyFile,
  moveFile,
  deleteFile,
  generateUniqueFilename,
  cleanupOrphanedFiles
};