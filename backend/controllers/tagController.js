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

    // Check if tag name already exists for this user
    const existingTagSnapshot = await collections.tags
      .where('userId', '==', userId)
      .where('name', '==', name)
      .get();

    if (!existingTagSnapshot.empty) {
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

    // Build query
    const query = collections.tags
      .where('userId', '==', userId)
      .orderBy('name', 'asc');

    // Execute query
    const tagsSnapshot = await query.get();
    
    const tags = tagsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis()
      };
    });

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
      const existingTagSnapshot = await collections.tags
        .where('userId', '==', userId)
        .where('name', '==', name)
        .get();

      if (!existingTagSnapshot.empty) {
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
    
    // Get all notes with this tag
    const notesSnapshot = await collections.notes
      .where('userId', '==', userId)
      .where('tags', 'array-contains', tagId)
      .get();
    
    // Remove tag from all notes
    notesSnapshot.docs.forEach(noteDoc => {
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

    // Build query
    let query = collections.notes
      .where('userId', '==', userId)
      .where('tags', 'array-contains', tagId);
    
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