/**
 * Image Controller
 * Handles image upload, retrieval, and deletion
 */

const { collections, bucket, Timestamp } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload an image for a note
 */
exports.uploadImage = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { noteId } = req.params;
    
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    // Check note exists and belongs to user
    const noteDoc = await collections.notes.doc(noteId).get();
    if (!noteDoc.exists) {
      return res.status(404).json({ 
        error: 'Note not found' 
      });
    }

    const noteData = noteDoc.data();
    if (noteData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this note' 
      });
    }

    // Check tier limits for file size
    if (req.tierLimits && !req.tierLimits.canUploadImage(req.file.size)) {
      return res.status(403).json({ 
        error: `Image exceeds the maximum size limit for your tier (${req.tierLimits.maxImageSize} bytes)` 
      });
    }

    // Get file data
    const file = req.file;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Validate file type
    if (!validExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only images (jpg, jpeg, png, gif, webp) are allowed' 
      });
    }

    // Generate unique filename
    const fileName = `${userId}/notes/${noteId}/${uuidv4()}${fileExtension}`;
    
    // Create a file reference in Firebase Storage
    const fileRef = bucket.file(fileName);
    
    // Create a write stream and upload the file
    const blobStream = fileRef.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    // Handle upload errors
    blobStream.on('error', (error) => {
      return next(error);
    });

    // Handle upload completion
    blobStream.on('finish', async () => {
      try {
        // Make the file publicly accessible
        await fileRef.makePublic();
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        
        // Create image metadata entry in Firestore
        const imageData = {
          noteId,
          userId,
          storageUrl: publicUrl,
          fileName: file.originalname,
          contentType: file.mimetype,
          size: file.size,
          width: req.imageMetadata?.width || null,
          height: req.imageMetadata?.height || null,
          createdAt: Timestamp.now()
        };
        
        const imageRef = await collections.noteImages.add(imageData);
        
        // Return response with image data
        res.status(201).json({
          message: 'Image uploaded successfully',
          image: {
            id: imageRef.id,
            ...imageData,
            createdAt: imageData.createdAt.toMillis()
          }
        });
      } catch (error) {
        next(error);
      }
    });

    // Write the file buffer to the stream
    blobStream.end(file.buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all images for a note
 */
exports.getNoteImages = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { noteId } = req.params;

    // Check note exists and belongs to user
    const noteDoc = await collections.notes.doc(noteId).get();
    if (!noteDoc.exists) {
      return res.status(404).json({ 
        error: 'Note not found' 
      });
    }

    const noteData = noteDoc.data();
    if (noteData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this note' 
      });
    }

    // Query for images
    const imagesSnapshot = await collections.noteImages
      .where('noteId', '==', noteId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const images = imagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis()
      };
    });

    res.status(200).json({ images });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an image
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { imageId } = req.params;

    // Get image
    const imageDoc = await collections.noteImages.doc(imageId).get();
    
    if (!imageDoc.exists) {
      return res.status(404).json({ 
        error: 'Image not found' 
      });
    }

    const imageData = imageDoc.data();
    
    // Check ownership
    if (imageData.userId !== userId) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this image' 
      });
    }

    // Extract filename from URL
    const storageUrl = imageData.storageUrl;
    const fileName = storageUrl.split('/').slice(4).join('/');
    
    // Delete file from Storage
    try {
      await bucket.file(fileName).delete();
    } catch (err) {
      console.error('Error deleting file from storage:', err);
      // Continue with Firestore deletion even if Storage deletion fails
    }
    
    // Delete image record from Firestore
    await imageDoc.ref.delete();

    res.status(200).json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all images for a user
 */
exports.getUserImages = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { limit = 20, page = 1 } = req.query;
    
    const pageSize = parseInt(limit);
    const offset = (parseInt(page) - 1) * pageSize;

    // Query for total count
    const countSnapshot = await collections.noteImages
      .where('userId', '==', userId)
      .count()
      .get();
    
    const totalImages = countSnapshot.data().count;
    
    // Query for paginated images
    const imagesSnapshot = await collections.noteImages
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .offset(offset)
      .get();
    
    const images = imagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toMillis()
      };
    });

    res.status(200).json({
      images,
      pagination: {
        total: totalImages,
        page: parseInt(page),
        pageSize,
        totalPages: Math.ceil(totalImages / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};