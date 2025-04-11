/**
 * Note Controller
 * Handles note CRUD operations
 */

const { collections, Timestamp, FieldValue } = require('../config/firebase');

/**
 * Create a new note
 */
exports.createNote = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleId, title, content, tags = [], isStarred = false } = req.body;

    // Validate module exists and belongs to user
    const moduleDoc = await collections.modules.doc(moduleId).get();
    if (!moduleDoc.exists) {
      return res.status(404).json({ 
        error: 'Module not found' 
      });
    }

    const moduleData = moduleDoc.data();
    if (moduleData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this module' 
      });
    }

    // Check module note count limit
    if (req.tierLimits && !req.tierLimits.canCreateNote) {
      return res.status(403).json({ 
        error: 'You have reached the maximum number of notes for this module on your tier' 
      });
    }

    // Validate tags exist and belong to user
    if (tags.length > 0) {
      const tagDocs = await collections.tags
        .where('userId', '==', userId)
        .where('id', 'in', tags)
        .get();
      
      // Check if all tags were found
      if (tagDocs.size !== tags.length) {
        return res.status(400).json({ 
          error: 'One or more tags are invalid' 
        });
      }
    }

    // Prepare content and extract plain text for searching
    let plainText = '';
    if (content && content.blocks) {
      plainText = content.blocks
        .map(block => block.content || '')
        .join(' ')
        .slice(0, 10000); // Limit plain text size
    }

    // Create new note
    const newNote = {
      moduleId,
      userId,
      title,
      content: content || {
        blocks: [],
        version: '1.0',
        plainText: ''
      },
      tags,
      isStarred,
      isArchived: false,
      sortOrder: Date.now(), // Use timestamp for default sorting
      lastEditedBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add plainText if we extracted it
    if (plainText) {
      newNote.content.plainText = plainText;
    }

    // Start a batch operation
    const batch = collections.db.batch();
    
    // Add note to Firestore
    const noteRef = collections.notes.doc();
    batch.set(noteRef, newNote);
    
    // Increment module's noteCount
    batch.update(moduleDoc.ref, { 
      noteCount: FieldValue.increment(1),
      updatedAt: Timestamp.now()
    });

    // Update tag counts
    if (tags.length > 0) {
      for (const tagId of tags) {
        const tagRef = collections.tags.doc(tagId);
        batch.update(tagRef, {
          noteCount: FieldValue.increment(1)
        });
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    // Return created note
    res.status(201).json({
      message: 'Note created successfully',
      note: {
        id: noteRef.id,
        ...newNote,
        createdAt: newNote.createdAt.toMillis(),
        updatedAt: newNote.updatedAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notes for a module
 */
exports.getModuleNotes = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { moduleId } = req.params;
    const { includeArchived } = req.query;

    // Validate module exists and belongs to user
    const moduleDoc = await collections.modules.doc(moduleId).get();
    if (!moduleDoc.exists) {
      return res.status(404).json({ 
        error: 'Module not found' 
      });
    }

    const moduleData = moduleDoc.data();
    if (moduleData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this module' 
      });
    }

    // Build query
    let query = collections.notes.where('moduleId', '==', moduleId);
    
    // Filter archived notes if not explicitly included
    if (includeArchived !== 'true') {
      query = query.where('isArchived', '==', false);
    }
    
    // Sort by sortOrder
    query = query.orderBy('sortOrder', 'asc');

    // Execute query
    const notesSnapshot = await query.get();
    
    const notes = notesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis()
      };
    });

    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all starred notes for a user
 */
exports.getStarredNotes = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { includeArchived } = req.query;

    // Build query
    let query = collections.notes
      .where('userId', '==', userId)
      .where('isStarred', '==', true);
    
    // Filter archived notes if not explicitly included
    if (includeArchived !== 'true') {
      query = query.where('isArchived', '==', false);
    }
    
    // Sort by updatedAt (most recent first)
    query = query.orderBy('updatedAt', 'desc');

    // Execute query
    const notesSnapshot = await query.get();
    
    const notes = notesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis()
      };
    });

    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent notes for a user
 */
exports.getRecentNotes = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { limit = 10 } = req.query;

    // Build query for non-archived notes
    const query = collections.notes
      .where('userId', '==', userId)
      .where('isArchived', '==', false)
      .orderBy('updatedAt', 'desc')
      .limit(parseInt(limit));

    // Execute query
    const notesSnapshot = await query.get();
    
    const notes = notesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis()
      };
    });

    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single note by ID
 */
exports.getNote = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { noteId } = req.params;

    // Get note
    const noteDoc = await collections.notes.doc(noteId).get();
    
    if (!noteDoc.exists) {
      return res.status(404).json({ 
        error: 'Note not found' 
      });
    }

    const noteData = noteDoc.data();
    
    // Check ownership
    if (noteData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this note' 
      });
    }

    // Return note data
    res.status(200).json({
      note: {
        id: noteDoc.id,
        ...noteData,
        createdAt: noteData.createdAt.toMillis(),
        updatedAt: noteData.updatedAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a note
 */
exports.updateNote = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { noteId } = req.params;
    const { title, content, tags, isStarred, isArchived, moduleId, sortOrder } = req.body;

    // Get note
    const noteDoc = await collections.notes.doc(noteId).get();
    
    if (!noteDoc.exists) {
      return res.status(404).json({ 
        error: 'Note not found' 
      });
    }

    const noteData = noteDoc.data();
    
    // Check ownership
    if (noteData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to update this note' 
      });
    }

    // If changing module, validate new module
    if (moduleId && moduleId !== noteData.moduleId) {
      const moduleDoc = await collections.modules.doc(moduleId).get();
      if (!moduleDoc.exists) {
        return res.status(404).json({ 
          error: 'Target module not found' 
        });
      }

      const moduleData = moduleDoc.data();
      if (moduleData.userId !== userId) {
        return res.status(403).json({ 
          error: 'You do not have permission to access the target module' 
        });
      }

      // Check module note count limit for the target module
      if (req.tierLimits && !req.tierLimits.canMoveNote) {
        return res.status(403).json({ 
          error: 'Target module has reached the maximum number of notes for your tier' 
        });
      }
    }

    // Start a batch operation
    const batch = collections.db.batch();

    // Build update object
    const updateData = {
      updatedAt: Timestamp.now(),
      lastEditedBy: userId
    };

    if (title !== undefined) updateData.title = title;
    if (isStarred !== undefined) updateData.isStarred = isStarred;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // Update content and extract plain text if provided
    if (content) {
      let plainText = '';
      if (content.blocks) {
        plainText = content.blocks
          .map(block => block.content || '')
          .join(' ')
          .slice(0, 10000); // Limit plain text size
        
        content.plainText = plainText;
      }
      updateData.content = content;
    }

    // Handle tag changes
    if (tags !== undefined) {
      const oldTags = noteData.tags || [];
      const newTags = tags || [];
      
      // Tags to remove (in old but not in new)
      const tagsToRemove = oldTags.filter(tagId => !newTags.includes(tagId));
      
      // Tags to add (in new but not in old)
      const tagsToAdd = newTags.filter(tagId => !oldTags.includes(tagId));
      
      // Update tag counts
      for (const tagId of tagsToRemove) {
        const tagRef = collections.tags.doc(tagId);
        batch.update(tagRef, {
          noteCount: FieldValue.increment(-1)
        });
      }
      
      for (const tagId of tagsToAdd) {
        const tagRef = collections.tags.doc(tagId);
        batch.update(tagRef, {
          noteCount: FieldValue.increment(1)
        });
      }
      
      updateData.tags = newTags;
    }

    // Handle module change
    if (moduleId && moduleId !== noteData.moduleId) {
      // Decrement old module note count
      const oldModuleRef = collections.modules.doc(noteData.moduleId);
      batch.update(oldModuleRef, { 
        noteCount: FieldValue.increment(-1),
        updatedAt: Timestamp.now()
      });
      
      // Increment new module note count
      const newModuleRef = collections.modules.doc(moduleId);
      batch.update(newModuleRef, { 
        noteCount: FieldValue.increment(1),
        updatedAt: Timestamp.now()
      });
      
      updateData.moduleId = moduleId;
    }

    // Update note
    batch.update(noteDoc.ref, updateData);
    
    // Commit the batch
    await batch.commit();

    // Get updated note
    const updatedNoteDoc = await collections.notes.doc(noteId).get();
    const updatedNoteData = updatedNoteDoc.data();

    // Return updated note
    res.status(200).json({
      message: 'Note updated successfully',
      note: {
        id: updatedNoteDoc.id,
        ...updatedNoteData,
        createdAt: updatedNoteData.createdAt.toMillis(),
        updatedAt: updatedNoteData.updatedAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a note
 */
exports.deleteNote = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { noteId } = req.params;

    // Get note
    const noteDoc = await collections.notes.doc(noteId).get();
    
    if (!noteDoc.exists) {
      return res.status(404).json({ 
        error: 'Note not found' 
      });
    }

    const noteData = noteDoc.data();
    
    // Check ownership
    if (noteData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this note' 
      });
    }

    // Start a batch operation
    const batch = collections.db.batch();

    // Get note images to delete
    const imagesSnapshot = await collections.noteImages
      .where('noteId', '==', noteId)
      .get();

    // Delete all images for the note
    imagesSnapshot.docs.forEach(imageDoc => {
      batch.delete(imageDoc.ref);
    });
    
    // Decrement module note count
    const moduleRef = collections.modules.doc(noteData.moduleId);
    batch.update(moduleRef, { 
      noteCount: FieldValue.increment(-1),
      updatedAt: Timestamp.now()
    });
    
    // Decrement tag note counts
    if (noteData.tags && noteData.tags.length > 0) {
      for (const tagId of noteData.tags) {
        const tagRef = collections.tags.doc(tagId);
        batch.update(tagRef, {
          noteCount: FieldValue.increment(-1)
        });
      }
    }
    
    // Delete the note
    batch.delete(noteDoc.ref);
    
    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search notes by content
 */
exports.searchNotes = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { query, moduleId } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    // Build base query
    let firestoreQuery = collections.notes
      .where('userId', '==', userId)
      .where('isArchived', '==', false);
    
    // Add module filter if provided
    if (moduleId) {
      firestoreQuery = firestoreQuery.where('moduleId', '==', moduleId);
    }
    
    // Execute query
    const notesSnapshot = await firestoreQuery.get();
    
    // Client-side filtering for text search (Firestore doesn't support full-text search)
    const queryLower = query.toLowerCase();
    
    const notes = notesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toMillis(),
          updatedAt: data.updatedAt.toMillis()
        };
      })
      .filter(note => {
        // Search in title
        if (note.title.toLowerCase().includes(queryLower)) {
          return true;
        }
        
        // Search in content plainText
        if (note.content && note.content.plainText && 
            note.content.plainText.toLowerCase().includes(queryLower)) {
          return true;
        }
        
        return false;
      })
      // Sort by relevance (title matches first, then by last updated)
      .sort((a, b) => {
        const aInTitle = a.title.toLowerCase().includes(queryLower);
        const bInTitle = b.title.toLowerCase().includes(queryLower);
        
        if (aInTitle && !bInTitle) return -1;
        if (!aInTitle && bInTitle) return 1;
        
        return b.updatedAt - a.updatedAt;
      });

    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
};