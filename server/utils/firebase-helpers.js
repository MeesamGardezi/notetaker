/**
 * Firebase Helpers
 * Utility functions for working with Firebase services
 */

const { admin, db, storage } = require('../config/firebase-admin');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate a unique ID for Firestore documents
 * @returns {string} - Unique ID
 */
const generateUniqueId = () => {
  return db.collection('_').doc().id;
};

/**
 * Convert Firestore timestamp to Date object
 * @param {Object} timestamp - Firestore timestamp
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
const timestampToDate = (timestamp) => {
  if (!timestamp || !timestamp._seconds) {
    return null;
  }
  
  return new Date(timestamp._seconds * 1000);
};

/**
 * Convert Firestore document to plain object
 * @param {Object} doc - Firestore document
 * @returns {Object} - Plain object with document data
 */
const documentToObject = (doc) => {
  if (!doc || !doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data()
  };
};

/**
 * Convert Firestore query snapshot to array of objects
 * @param {Object} snapshot - Firestore query snapshot
 * @returns {Array} - Array of objects with document data
 */
const querySnapshotToArray = (snapshot) => {
  if (snapshot.empty) {
    return [];
  }
  
  const result = [];
  snapshot.forEach(doc => {
    result.push(documentToObject(doc));
  });
  
  return result;
};

/**
 * Generate a unique filename for storage
 * @param {string} originalFilename - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalFilename) => {
  const fileExtension = path.extname(originalFilename);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${fileExtension}`;
};

/**
 * Get a signed URL for a file in storage
 * @param {string} storagePath - Path to the file in storage
 * @param {number} expirationTime - Expiration time in milliseconds
 * @returns {Promise<string>} - Signed URL
 */
const getSignedUrl = async (storagePath, expirationTime = 3600000) => {
  try {
    const fileRef = storage.bucket().file(storagePath);
    
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
 * Create a batch of operations
 * @returns {Object} - Firestore batch
 */
const createBatch = () => {
  return db.batch();
};

/**
 * Run a Firestore transaction
 * @param {Function} updateFunction - Transaction update function
 * @returns {Promise<any>} - Transaction result
 */
const runTransaction = async (updateFunction) => {
  return db.runTransaction(updateFunction);
};

/**
 * Check if a reference exists
 * @param {Object} reference - Firestore document reference
 * @returns {Promise<boolean>} - Whether reference exists
 */
const doesReferenceExist = async (reference) => {
  const doc = await reference.get();
  return doc.exists;
};

module.exports = {
  generateUniqueId,
  timestampToDate,
  documentToObject,
  querySnapshotToArray,
  generateUniqueFilename,
  getSignedUrl,
  createBatch,
  runTransaction,
  doesReferenceExist
};