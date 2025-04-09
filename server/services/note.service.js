/**
 * Note Service
 * Handles operations related to notes (second-level content items within modules)
 */

const { admin, db } = require('../config/firebase-admin');
const config = require('../config/config');

/**
 * Create a new note
 * @param {string} userId - User ID
 * @param {string} moduleId - Module ID
 * @param {Object} noteData - Note data (title, content)
 * @returns {Promise<Object>} - Created note data
 */
const createNote = async (userId, moduleId, noteData) => {
  try {
    // Get module document to check ownership and tier limits
    const moduleRef = db.collection('modules').doc(moduleId);
    const moduleDoc = await moduleRef.get();
    
    if (!moduleDoc.exists) {
      throw new Error('Module not found');
    }
    
    const moduleData = moduleDoc.data();
    
    // Check if module belongs to the user
    if (moduleData.userId !== userId) {
      throw new Error('Unauthorized access to module');
    }
    
    // Get user document to check tier limits
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Check if user is at note limit for this module based on their tier
    const tierConfig = config.tiers[userData.accountTier];
    if (moduleData.noteCount >= tierConfig.maxNotesPerModule) {
      throw new Error(`Maximum number of notes (${tierConfig.maxNotesPerModule}) reached for this module in your account tier`);
    }
    
    // Get position for new note (count + 1)
    const position = moduleData.noteCount + 1;
    
    // Create note document
    const noteRef = db.collection('notes').doc();
    const newNote = {
      title: noteData.title || 'Untitled Note',
      content: noteData.content || '',
      position,
      moduleId,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      mediaFiles: []
    };
    
    // Use a transaction to create note and update counters
    await db.runTransaction(async (transaction) => {
      transaction.set(noteRef, newNote);
      
      // Update module's note count
      transaction.update(moduleRef, {
        noteCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user's note count
      transaction.update(userRef, {
        noteCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    return {
      id: noteRef.id,
      ...newNote
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all notes for a module
 * @param {string} moduleId - Module ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Array>} - List of notes
 */
const getModuleNotes = async (moduleId, userId) => {
  try {
    // First, check if the module belongs to the user
    const moduleDoc = await db.collection('modules').doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      throw new Error('Module not found');
    }
    
    if (moduleDoc.data().userId !== userId) {
      throw new Error('Unauthorized access to module');
    }
    
    // Get all notes in the module
    const notesSnapshot = await db.collection('notes')
      .where('moduleId', '==', moduleId)
      .orderBy('position', 'asc')
      .get();
    
    if (notesSnapshot.empty) {
      return [];
    }
    
    const notes = [];
    notesSnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notes;
  } catch (error) {
    throw error;
  }
};

/**
 * Get note by ID
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Note data
 */
const getNoteById = async (noteId, userId) => {
  try {
    const noteDoc = await db.collection('notes').doc(noteId).get();
    
    if (!noteDoc.exists) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    
    // Check if note belongs to the user
    if (noteData.userId !== userId) {
      throw new Error('Unauthorized access to note');
    }
    
    return {
      id: noteDoc.id,
      ...noteData
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update a note
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} updateData - Note data to update
 * @returns {Promise<Object>} - Updated note data
 */
const updateNote = async (noteId, userId, updateData) => {
  try {
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
    
    // Prepare update object (only allow certain fields to be updated)
    const update = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (updateData.title !== undefined) update.title = updateData.title;
    if (updateData.content !== undefined) update.content = updateData.content;
    
    // Update the note
    await noteRef.update(update);
    
    // Return updated note data
    return {
      id: noteId,
      ...noteData,
      ...update
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a note
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<void>}
 */
const deleteNote = async (noteId, userId) => {
  try {
    // Get references
    const noteRef = db.collection('notes').doc(noteId);
    
    // Get note document
    const noteDoc = await noteRef.get();
    
    if (!noteDoc.exists) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    
    // Check if note belongs to the user
    if (noteData.userId !== userId) {
      throw new Error('Unauthorized access to note');
    }
    
    const moduleId = noteData.moduleId;
    const moduleRef = db.collection('modules').doc(moduleId);
    const userRef = db.collection('users').doc(userId);
    
    // Calculate total storage used by media files
    const totalStorageSize = noteData.mediaFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // Use a transaction to delete note and update counters
    await db.runTransaction(async (transaction) => {
      // Delete the note
      transaction.delete(noteRef);
      
      // Update module's note count
      transaction.update(moduleRef, {
        noteCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user's note count and storage used
      transaction.update(userRef, {
        noteCount: admin.firestore.FieldValue.increment(-1),
        storageUsed: admin.firestore.FieldValue.increment(-totalStorageSize),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Reorder notes within a module
 * @param {string} moduleId - Module ID
 * @param {string} userId - User ID (for authorization)
 * @param {Array<{id: string, position: number}>} orderData - Array of note IDs and positions
 * @returns {Promise<void>}
 */
const reorderNotes = async (moduleId, userId, orderData) => {
  try {
    // Validate input
    if (!Array.isArray(orderData)) {
      throw new Error('Invalid order data format');
    }
    
    // First, check if the module belongs to the user
    const moduleDoc = await db.collection('modules').doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      throw new Error('Module not found');
    }
    
    if (moduleDoc.data().userId !== userId) {
      throw new Error('Unauthorized access to module');
    }
    
    // Create batch for multiple updates
    const batch = db.batch();
    
    // Update position for each note
    for (const item of orderData) {
      const { id, position } = item;
      const noteRef = db.collection('notes').doc(id);
      
      // Verify note belongs to this module and user before adding to batch
      const noteDoc = await noteRef.get();
      if (!noteDoc.exists || noteDoc.data().moduleId !== moduleId || noteDoc.data().userId !== userId) {
        throw new Error(`Unauthorized access to note: ${id}`);
      }
      
      batch.update(noteRef, {
        position,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Commit the batch
    await batch.commit();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNote,
  getModuleNotes,
  getNoteById,
  updateNote,
  deleteNote,
  reorderNotes
};