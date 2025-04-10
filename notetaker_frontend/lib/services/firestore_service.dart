import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/module.dart';
import '../models/note.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Modules Collection
  CollectionReference get _modulesCollection => _firestore.collection('modules');
  
  // Notes Collection
  CollectionReference get _notesCollection => _firestore.collection('notes');
  
  // Users Collection
  CollectionReference get _usersCollection => _firestore.collection('users');
  
  // MODULES
  
  // Create a new module
  Future<Module> createModule(Module module) async {
    try {
      // Add new module document
      final docRef = await _modulesCollection.add(module.toNewModuleMap());
      
      // Update user's module count
      await _usersCollection.doc(module.userId).update({
        'moduleCount': FieldValue.increment(1),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Return updated module with ID
      return module.copyWith(id: docRef.id);
    } catch (e) {
      print('Error creating module: $e');
      rethrow;
    }
  }
  
  // Get all modules for a user
  Future<List<Module>> getUserModules(String userId) async {
    try {
      final querySnapshot = await _modulesCollection
          .where('userId', isEqualTo: userId)
          .orderBy('position')
          .get();
      
      return querySnapshot.docs.map((doc) {
        return Module.fromMap(doc.id, doc.data() as Map<String, dynamic>);
      }).toList();
    } catch (e) {
      print('Error getting user modules: $e');
      return [];
    }
  }
  
  // Stream of user modules
  Stream<List<Module>> userModulesStream(String userId) {
    return _modulesCollection
        .where('userId', isEqualTo: userId)
        .orderBy('position')
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) {
            return Module.fromMap(doc.id, doc.data() as Map<String, dynamic>);
          }).toList();
        });
  }
  
  // Get a single module
  Future<Module?> getModule(String moduleId) async {
    try {
      final docSnapshot = await _modulesCollection.doc(moduleId).get();
      
      if (docSnapshot.exists) {
        return Module.fromMap(docSnapshot.id, docSnapshot.data() as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      print('Error getting module: $e');
      return null;
    }
  }
  
  // Update a module
  Future<void> updateModule(Module module) async {
    await _modulesCollection.doc(module.id).update(module.toMap());
  }
  
  // Delete a module
  Future<void> deleteModule(Module module) async {
    try {
      // Get all notes in this module
      final notesQuery = await _notesCollection
          .where('moduleId', isEqualTo: module.id)
          .get();
      
      // Start a batch write
      final batch = _firestore.batch();
      
      // Delete all notes in the module
      for (var doc in notesQuery.docs) {
        batch.delete(doc.reference);
      }
      
      // Delete the module
      batch.delete(_modulesCollection.doc(module.id));
      
      // Update user's counts
      batch.update(_usersCollection.doc(module.userId), {
        'moduleCount': FieldValue.increment(-1),
        'noteCount': FieldValue.increment(-notesQuery.docs.length),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Commit batch
      await batch.commit();
    } catch (e) {
      print('Error deleting module: $e');
      rethrow;
    }
  }
  
  // Reorder modules
  Future<void> reorderModules(String userId, List<Module> modules) async {
    try {
      final batch = _firestore.batch();
      
      for (int i = 0; i < modules.length; i++) {
        batch.update(_modulesCollection.doc(modules[i].id), {
          'position': i,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
      
      await batch.commit();
    } catch (e) {
      print('Error reordering modules: $e');
      rethrow;
    }
  }
  
  // NOTES
  
  // Create a new note
  Future<Note> createNote(Note note) async {
    try {
      // Add new note document
      final docRef = await _notesCollection.add(note.toNewNoteMap());
      
      // Update module's note count
      await _modulesCollection.doc(note.moduleId).update({
        'noteCount': FieldValue.increment(1),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Update user's note count
      await _usersCollection.doc(note.userId).update({
        'noteCount': FieldValue.increment(1),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Return updated note with ID
      return note.copyWith(id: docRef.id);
    } catch (e) {
      print('Error creating note: $e');
      rethrow;
    }
  }
  
  // Get all notes in a module
  Future<List<Note>> getModuleNotes(String moduleId) async {
    try {
      final querySnapshot = await _notesCollection
          .where('moduleId', isEqualTo: moduleId)
          .orderBy('position')
          .get();
      
      return querySnapshot.docs.map((doc) {
        return Note.fromMap(doc.id, doc.data() as Map<String, dynamic>);
      }).toList();
    } catch (e) {
      print('Error getting module notes: $e');
      return [];
    }
  }
  
  // Stream of module notes
  Stream<List<Note>> moduleNotesStream(String moduleId) {
    return _notesCollection
        .where('moduleId', isEqualTo: moduleId)
        .orderBy('position')
        .snapshots()
        .map((snapshot) {
          return snapshot.docs.map((doc) {
            return Note.fromMap(doc.id, doc.data() as Map<String, dynamic>);
          }).toList();
        });
  }
  
  // Get recent notes for a user
  Future<List<Note>> getRecentNotes(String userId, {int limit = 5}) async {
    try {
      final querySnapshot = await _notesCollection
          .where('userId', isEqualTo: userId)
          .orderBy('updatedAt', descending: true)
          .limit(limit)
          .get();
      
      return querySnapshot.docs.map((doc) {
        return Note.fromMap(doc.id, doc.data() as Map<String, dynamic>);
      }).toList();
    } catch (e) {
      print('Error getting recent notes: $e');
      return [];
    }
  }
  
  // Get a single note
  Future<Note?> getNote(String noteId) async {
    try {
      final docSnapshot = await _notesCollection.doc(noteId).get();
      
      if (docSnapshot.exists) {
        return Note.fromMap(docSnapshot.id, docSnapshot.data() as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      print('Error getting note: $e');
      return null;
    }
  }
  
  // Update a note
  Future<void> updateNote(Note note) async {
    await _notesCollection.doc(note.id).update(note.toMap());
  }
  
  // Delete a note
  Future<void> deleteNote(Note note) async {
    try {
      // Get current note data to check media files
      final noteDoc = await _notesCollection.doc(note.id).get();
      final noteData = noteDoc.data() as Map<String, dynamic>?;
      
      // Calculate total media file size
      int totalMediaSize = 0;
      if (noteData != null && noteData['mediaFiles'] != null) {
        final mediaFiles = noteData['mediaFiles'] as List<dynamic>;
        for (var media in mediaFiles) {
          totalMediaSize += (media['size'] as int?) ?? 0;
        }
      }
      
      // Start batch write
      final batch = _firestore.batch();
      
      // Delete the note
      batch.delete(_notesCollection.doc(note.id));
      
      // Update module's note count
      batch.update(_modulesCollection.doc(note.moduleId), {
        'noteCount': FieldValue.increment(-1),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Update user's note count and storage used
      batch.update(_usersCollection.doc(note.userId), {
        'noteCount': FieldValue.increment(-1),
        'storageUsed': FieldValue.increment(-totalMediaSize),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      // Commit batch
      await batch.commit();
    } catch (e) {
      print('Error deleting note: $e');
      rethrow;
    }
  }
  
  // Reorder notes
  Future<void> reorderNotes(String moduleId, List<Note> notes) async {
    try {
      final batch = _firestore.batch();
      
      for (int i = 0; i < notes.length; i++) {
        batch.update(_notesCollection.doc(notes[i].id), {
          'position': i,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
      
      await batch.commit();
    } catch (e) {
      print('Error reordering notes: $e');
      rethrow;
    }
  }
}