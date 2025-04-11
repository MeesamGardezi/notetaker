/**
 * Tag Controller
 * Handles tag CRUD operations
 */

const { collections, Timestamp } = require('../config/firebase');

/**
 * Create a new tag
 */
exports.createTag = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name, color } = req.body;

    // Get all tags for this user to check for duplicates
    const tagsSnapshot = await collections.tags
      .where('userId', '==', userId)
      .get();
    
    const existingTag = tagsSnapshot.docs.find(doc => 
      doc.data().name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingTag) {
      return res.status(409).json({ 
        error: 'A tag with this name already exists' 
      });
    }

    // Check user tier limits for tags
    if (req.tierLimits && !req.tierLimits.canCreateTag) {
      return res.status(403).json({ 
        error: 'You have reached the maximum number of tags for your tier' 
      });
    }

    // Create new tag
    const newTag = {
      userId,
      name,
      color: color || null,
      noteCount: 0,
      createdAt: Timestamp.now()
    };

    // Add tag to Firestore
    const tagRef = await collections.tags.add(newTag);
    
    // Return created tag
    res.status(201).json({
      message: 'Tag created successfully',
      tag: {
        id: tagRef.id,
        ...newTag,
        createdAt: newTag.createdAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tags for user
 */
exports.getTags = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Simple query - only filter by userId
    const tagsSnapshot = await collections.tags
      .where('userId', '==', userId)
      .get();
    
    let tags = tagsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis()
      };
    });
    
    // Sort by name in memory
    tags.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ tags });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a tag
 */
exports.updateTag = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { tagId } = req.params;
    const { name, color } = req.body;

    // Get tag
    const tagDoc = await collections.tags.doc(tagId).get();
    
    if (!tagDoc.exists) {
      return res.status(404).json({ 
        error: 'Tag not found' 
      });
    }

    const tagData = tagDoc.data();
    
    // Check ownership
    if (tagData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to update this tag' 
      });
    }

    // If name is changing, check for duplicates
    if (name && name !== tagData.name) {
      // Get all tags for this user to check for duplicates
      const tagsSnapshot = await collections.tags
        .where('userId', '==', userId)
        .get();
      
      const existingTag = tagsSnapshot.docs.find(doc => 
        doc.id !== tagId && 
        doc.data().name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingTag) {
        return res.status(409).json({ 
          error: 'A tag with this name already exists' 
        });
      }
    }

    // Build update object
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;

    // Update tag
    if (Object.keys(updateData).length > 0) {
      await tagDoc.ref.update(updateData);
    }

    // Get updated tag
    const updatedTagDoc = await collections.tags.doc(tagId).get();
    const updatedTagData = updatedTagDoc.data();

    // Return updated tag
    res.status(200).json({
      message: 'Tag updated successfully',
      tag: {
        id: updatedTagDoc.id,
        ...updatedTagData,
        createdAt: updatedTagData.createdAt.toMillis()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a tag
 */
exports.deleteTag = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { tagId } = req.params;

    // Get tag
    const tagDoc = await collections.tags.doc(tagId).get();
    
    if (!tagDoc.exists) {
      return res.status(404).json({ 
        error: 'Tag not found' 
      });
    }

    const tagData = tagDoc.data();
    
    // Check ownership
    if (tagData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this tag' 
      });
    }

    // Start a batch operation
    const batch = collections.db.batch();
    
    // Get all notes with this tag using a simple query
    const notesSnapshot = await collections.notes
      .where('userId', '==', userId)
      .get();
    
    const notesWithTag = notesSnapshot.docs.filter(doc => {
      const noteData = doc.data();
      return noteData.tags && noteData.tags.includes(tagId);
    });
    
    // Remove tag from all notes
    notesWithTag.forEach(noteDoc => {
      const noteData = noteDoc.data();
      const updatedTags = noteData.tags.filter(t => t !== tagId);
      batch.update(noteDoc.ref, { 
        tags: updatedTags,
        updatedAt: Timestamp.now()
      });
    });
    
    // Delete the tag
    batch.delete(tagDoc.ref);
    
    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notes by tag
 */
exports.getNotesByTag = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { tagId } = req.params;
    const { includeArchived } = req.query;

    // Check tag exists and belongs to user
    const tagDoc = await collections.tags.doc(tagId).get();
    if (!tagDoc.exists) {
      return res.status(404).json({ 
        error: 'Tag not found' 
      });
    }

    const tagData = tagDoc.data();
    if (tagData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this tag' 
      });
    }

    // Simple query - only filter by userId
    const notesSnapshot = await collections.notes
      .where('userId', '==', userId)
      .get();
    
    // Filter notes by tag in memory
    let notes = notesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toMillis(),
          updatedAt: data.updatedAt.toMillis()
        };
      })
      .filter(note => note.tags && note.tags.includes(tagId));
    
    // Filter archived notes in memory if needed
    if (includeArchived !== 'true') {
      notes = notes.filter(note => note.isArchived === false);
    }
    
    // Sort by updatedAt (most recent first) in memory
    notes.sort((a, b) => b.updatedAt - a.updatedAt);

    res.status(200).json({ 
      tag: {
        id: tagDoc.id,
        ...tagData,
        createdAt: tagData.createdAt.toMillis()
      },
      notes 
    });
  } catch (error) {
    next(error);
  }
};