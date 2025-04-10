import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:uuid/uuid.dart';
import 'package:path/path.dart' as path;
import '../models/note.dart';

class StorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final _uuid = Uuid();
  
  // Upload a file
  Future<MediaItem> uploadFile(File file, String userId, String noteId) async {
    try {
      // Generate unique filename
      final filename = '${DateTime.now().millisecondsSinceEpoch}-${_uuid.v4()}${path.extension(file.path)}';
      final originalFilename = path.basename(file.path);
      
      // Define the file path in storage
      final storagePath = 'users/$userId/notes/$noteId/$filename';
      
      // Upload the file
      final fileRef = _storage.ref().child(storagePath);
      final uploadTask = fileRef.putFile(file);
      final snapshot = await uploadTask;
      
      // Get file metadata
      final size = await file.length();
      final mimeType = _getMimeType(file.path);
      
      // Get download URL
      final url = await snapshot.ref.getDownloadURL();
      
      // Create media item
      final mediaItem = MediaItem(
        id: _uuid.v4(),
        filename: filename,
        originalFilename: originalFilename,
        storagePath: storagePath,
        mimeType: mimeType,
        size: size,
        url: url,
        createdAt: DateTime.now(),
      );
      
      // Update note in Firestore with new media item
      final noteRef = _firestore.collection('notes').doc(noteId);
      await noteRef.update({
        'mediaFiles': FieldValue.arrayUnion([mediaItem.toMap()]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Update user's storage used
      await _firestore.collection('users').doc(userId).update({
        'storageUsed': FieldValue.increment(size),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      return mediaItem;
    } catch (e) {
      print('Error uploading file: $e');
      rethrow;
    }
  }
  
  // Delete a file
  Future<void> deleteFile(MediaItem mediaItem, String userId, String noteId) async {
    try {
      // Delete the file from storage
      final fileRef = _storage.ref().child(mediaItem.storagePath);
      await fileRef.delete();
      
      // Update the note by removing the media item
      final noteRef = _firestore.collection('notes').doc(noteId);
      await noteRef.update({
        'mediaFiles': FieldValue.arrayRemove([mediaItem.toMap()]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Update user's storage used
      await _firestore.collection('users').doc(userId).update({
        'storageUsed': FieldValue.increment(-mediaItem.size),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error deleting file: $e');
      rethrow;
    }
  }
  
  // Get a fresh download URL (for expired URLs)
  Future<String> refreshUrl(String storagePath) async {
    try {
      final fileRef = _storage.ref().child(storagePath);
      return await fileRef.getDownloadURL();
    } catch (e) {
      print('Error refreshing URL: $e');
      rethrow;
    }
  }
  
  // Helper method to determine MIME type
  String _getMimeType(String filePath) {
    final ext = path.extension(filePath).toLowerCase();
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.pdf':
        return 'application/pdf';
      case '.doc':
        return 'application/msword';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }
}