/**
 * Media Service
 * Handles operations related to media files (uploads, storage, attachments to notes)
 */

const { admin, db, storage } = require('../config/firebase.config').getFirebaseServices();
const path = require('path');
const crypto = require('crypto');

/**
 * Upload media file to a note
 * @param {string} userId - User ID
 * @param {string} noteId - Note ID
 * @param {Object} fileData - File information
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Object>} - Uploaded file information
 */
const uploadMedia = async (userId, noteId, fileData, buffer) => {
  try {
    // Get note document to check ownership
    const noteRef = db.collection('notes').doc(noteId);
    const noteDoc = await noteRef.get();
    
    if (!noteDoc.exists) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    
    // Check if note belongs to the user
    if (noteData.userId !== userId) {
      throw new Error('Unauthorized access to note');
    }
    
    // Get user document to check storage limits
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    // Generate a unique filename
    const fileExtension = path.extname(fileData.originalname);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${randomString}${fileExtension}`;
    
    // Define the file path in Firebase Storage
    const storagePath = `users/${userId}/notes/${noteId}/${filename}`;
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    
    // Upload the file
    await file.save(buffer, {
      metadata: {
        contentType: fileData.mimetype,
        metadata: {
          originalFilename: fileData.originalname,
          userId,
          noteId
        }
      }
    });
    
    // Get signed URL for the file (valid for 7 days)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Create media file object
    const mediaFile = {
      id: `${timestamp}-${randomString}`,
      filename,
      originalFilename: fileData.originalname,
      storagePath,
      mimeType: fileData.mimetype,
      size: buffer.length,
      url,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update note with new media file
    await db.runTransaction(async (transaction) => {
      // Add media file to note
      transaction.update(noteRef, {
        mediaFiles: admin.firestore.FieldValue.arrayUnion(mediaFile),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user storage usage
      transaction.update(userRef, {
        storageUsed: admin.firestore.FieldValue.increment(buffer.length),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    return {
      ...mediaFile,
      createdAt: new Date() // Convert server timestamp to date for immediate use
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete media file from a note
 * @param {string} userId - User ID
 * @param {string} noteId - Note ID
 * @param {string} mediaId - Media file ID
 * @returns {Promise<void>}
 */
const deleteMedia = async (userId, noteId, mediaId) => {
  try {
    // Get note document to check ownership
    const noteRef = db.collection('notes').doc(noteId);
    const noteDoc = await noteRef.get();
    
    if (!noteDoc.exists) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    
    // Check if note belongs to the user
    if (noteData.userId !== userId) {
      throw new Error('Unauthorized access to note');
    }
    
    // Find the media file to delete
    const mediaFile = noteData.mediaFiles.find(file => file.id === mediaId);
    
    if (!mediaFile) {
      throw new Error('Media file not found in note');
    }
    
    // Delete file from Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(mediaFile.storagePath);
    await file.delete();
    
    // Get user reference
    const userRef = db.collection('users').doc(userId);
    
    // Update note and user document
    await db.runTransaction(async (transaction) => {
      // Remove media file from note
      transaction.update(noteRef, {
        mediaFiles: admin.firestore.FieldValue.arrayRemove(mediaFile),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user storage usage
      transaction.update(userRef, {
        storageUsed: admin.firestore.FieldValue.increment(-mediaFile.size),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all media files for a note
 * @param {string} userId - User ID
 * @param {string} noteId - Note ID
 * @returns {Promise<Array>} - List of media files
 */
const getNoteMedia = async (userId, noteId) => {
  try {
    // Get note document to check ownership
    const noteDoc = await db.collection('notes').doc(noteId).get();
    
    if (!noteDoc.exists) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    
    // Check if note belongs to the user
    if (noteData.userId !== userId) {
      throw new Error('Unauthorized access to note');
    }
    
    // Generate fresh signed URLs for all media files
    const mediaFiles = await Promise.all(noteData.mediaFiles.map(async (file) => {
      // Check if file exists in storage
      try {
        const bucket = storage.bucket();
        const storageFile = bucket.file(file.storagePath);
        const [exists] = await storageFile.exists();
        
        if (!exists) {
          return {
            ...file,
            url: null,
            error: 'File not found in storage'
          };
        }
        
        // Get fresh URL
        const [url] = await storageFile.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        return {
          ...file,
          url
        };
      } catch (error) {
        return {
          ...file,
          url: null,
          error: 'Failed to get URL'
        };
      }
    }));
    
    return mediaFiles;
  } catch (error) {
    throw error;
  }
};

/**
 * Get signed URL for a media file
 * @param {string} userId - User ID
 * @param {string} noteId - Note ID
 * @param {string} mediaId - Media file ID
 * @returns {Promise<string>} - Signed URL
 */
const getSignedUrl = async (userId, noteId, mediaId) => {
  try {
    // Get note document to check ownership
    const noteDoc = await db.collection('notes').doc(noteId).get();
    
    if (!noteDoc.exists) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    
    // Check if note belongs to the user
    if (noteData.userId !== userId) {
      throw new Error('Unauthorized access to note');
    }
    
    // Find the media file
    const mediaFile = noteData.mediaFiles.find(file => file.id === mediaId);
    
    if (!mediaFile) {
      throw new Error('Media file not found in note');
    }
    
    // Generate signed URL
    const bucket = storage.bucket();
    const file = bucket.file(mediaFile.storagePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      throw new Error('File not found in storage');
    }
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return url;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  uploadMedia,
  deleteMedia,
  getNoteMedia,
  getSignedUrl
};