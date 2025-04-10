/**
 * Firebase Service
 * Provides helpers for working with Firebase services
 */

const { admin, db, auth, storage } = require('../config/firebase.config').getFirebaseServices();

/**
 * Get Firestore collection data with pagination
 * @param {string} collection - Collection name
 * @param {Object} query - Query parameters
 * @param {number} limit - Number of documents to retrieve
 * @param {Object} startAfter - Document to start after (for pagination)
 * @returns {Promise<Object>} - Query results
 */
const getCollectionData = async (collection, query = {}, limit = 10, startAfter = null) => {
  try {
    let ref = db.collection(collection);
    
    // Apply query filters
    if (query) {
      // Apply where clauses
      if (query.where && Array.isArray(query.where)) {
        for (const filter of query.where) {
          if (filter.length === 3) {
            const [field, operator, value] = filter;
            ref = ref.where(field, operator, value);
          }
        }
      }
      
      // Apply orderBy
      if (query.orderBy) {
        const [field, direction = 'asc'] = Array.isArray(query.orderBy) 
          ? query.orderBy 
          : [query.orderBy];
        
        ref = ref.orderBy(field, direction);
      }
    }
    
    // Apply pagination
    if (limit > 0) {
      ref = ref.limit(limit);
    }
    
    if (startAfter) {
      ref = ref.startAfter(startAfter);
    }
    
    // Execute query
    const snapshot = await ref.get();
    
    // Parse results
    const data = [];
    let lastDoc = null;
    
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
      lastDoc = doc;
    });
    
    return {
      data,
      lastDoc,
      hasMore: data.length === limit
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create a document in Firestore
 * @param {string} collection - Collection name
 * @param {Object} data - Document data
 * @param {string} id - Document ID (optional, auto-generated if not provided)
 * @returns {Promise<Object>} - Created document
 */
const createDocument = async (collection, data, id = null) => {
  try {
    // Add timestamps
    const docData = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    let docRef;
    
    if (id) {
      // Create with specified ID
      docRef = db.collection(collection).doc(id);
      await docRef.set(docData);
    } else {
      // Create with auto-generated ID
      docRef = await db.collection(collection).add(docData);
    }
    
    return {
      id: docRef.id,
      ...docData,
      createdAt: new Date(), // Convert server timestamp to date for immediate use
      updatedAt: new Date()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update a document in Firestore
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @param {Object} data - Document data to update
 * @returns {Promise<Object>} - Updated document
 */
const updateDocument = async (collection, id, data) => {
  try {
    const docRef = db.collection(collection).doc(id);
    
    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Document not found: ${collection}/${id}`);
    }
    
    // Add timestamp
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update document
    await docRef.update(updateData);
    
    // Get updated document
    const updatedDoc = await docRef.get();
    
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a document from Firestore
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @returns {Promise<void>}
 */
const deleteDocument = async (collection, id) => {
  try {
    const docRef = db.collection(collection).doc(id);
    
    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Document not found: ${collection}/${id}`);
    }
    
    // Delete document
    await docRef.delete();
  } catch (error) {
    throw error;
  }
};

/**
 * Run a transaction
 * @param {Function} updateFunction - Transaction function
 * @returns {Promise<any>} - Transaction result
 */
const runTransaction = async (updateFunction) => {
  try {
    return await db.runTransaction(updateFunction);
  } catch (error) {
    throw error;
  }
};

/**
 * Batch write operations
 * @param {Array<{type: string, collection: string, id: string, data: Object}>} operations - Batch operations
 * @returns {Promise<void>}
 */
const batchWrite = async (operations) => {
  try {
    // Create batch
    const batch = db.batch();
    
    // Add operations to batch
    for (const op of operations) {
      const docRef = db.collection(op.collection).doc(op.id);
      
      if (op.type === 'set') {
        batch.set(docRef, {
          ...op.data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (op.type === 'update') {
        batch.update(docRef, {
          ...op.data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    }
    
    // Commit batch
    await batch.commit();
  } catch (error) {
    throw error;
  }
};

/**
 * Get document by ID
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @returns {Promise<Object|null>} - Document data or null if not found
 */
const getDocumentById = async (collection, id) => {
  try {
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Upload file to Firebase Storage
 * @param {string} path - Storage path
 * @param {Buffer} buffer - File buffer
 * @param {Object} metadata - File metadata
 * @returns {Promise<string>} - Download URL
 */
const uploadFile = async (path, buffer, metadata = {}) => {
  try {
    const file = storage.bucket().file(path);
    
    // Upload file
    await file.save(buffer, {
      metadata: {
        contentType: metadata.contentType || 'application/octet-stream',
        metadata
      }
    });
    
    // Get download URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return url;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete file from Firebase Storage
 * @param {string} path - Storage path
 * @returns {Promise<void>}
 */
const deleteFile = async (path) => {
  try {
    const file = storage.bucket().file(path);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }
    
    // Delete file
    await file.delete();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getCollectionData,
  createDocument,
  updateDocument,
  deleteDocument,
  runTransaction,
  batchWrite,
  getDocumentById,
  uploadFile,
  deleteFile
};