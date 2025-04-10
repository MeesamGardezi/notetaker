import 'dart:io';

import 'package:flutter/foundation.dart';
import '../models/note.dart';
import '../services/firestore_service.dart';
import '../services/storage_service.dart';

class NoteNotifier {
  final FirestoreService _firestoreService;
  final StorageService _storageService;
  
  // Note state
  final ValueNotifier<List<Note>> _notes = ValueNotifier<List<Note>>([]);
  final ValueNotifier<Note?> _selectedNote = ValueNotifier<Note?>(null);
  final ValueNotifier<List<Note>> _recentNotes = ValueNotifier<List<Note>>([]);
  final ValueNotifier<bool> _isLoading = ValueNotifier<bool>(false);
  final ValueNotifier<String?> _error = ValueNotifier<String?>(null);
  
  // Media upload state
  final ValueNotifier<double> _uploadProgress = ValueNotifier<double>(0);
  final ValueNotifier<bool> _isUploading = ValueNotifier<bool>(false);
  
  // Expose notifiers as read-only
  ValueListenable<List<Note>> get notes => _notes;
  ValueListenable<Note?> get selectedNote => _selectedNote;
  ValueListenable<List<Note>> get recentNotes => _recentNotes;
  ValueListenable<bool> get isLoading => _isLoading;
  ValueListenable<String?> get error => _error;
  ValueListenable<double> get uploadProgress => _uploadProgress;
  ValueListenable<bool> get isUploading => _isUploading;
  
  NoteNotifier(this._firestoreService, this._storageService);
  
  // Load notes for a module
  Future<void> loadNotes(String moduleId) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      final notesList = await _firestoreService.getModuleNotes(moduleId);
      _notes.value = notesList;
    } catch (e) {
      _error.value = 'Failed to load notes';
      print('Load notes error: $e');
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Load recent notes for a user
  Future<void> loadRecentNotes(String userId, {int limit = 5}) async {
    try {
      final notesList = await _firestoreService.getRecentNotes(userId, limit: limit);
      _recentNotes.value = notesList;
    } catch (e) {
      print('Load recent notes error: $e');
      // Don't set error state here to avoid disrupting main flows
    }
  }
  
  // Create a note
  Future<Note?> createNote(String title, String content, String moduleId, String userId) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      // Determine note position (add to end)
      final position = _notes.value.length;
      
      // Create new note
      final newNote = Note(
        id: '', // Will be assigned by Firestore
        title: title,
        content: content,
        position: position,
        moduleId: moduleId,
        userId: userId,
        mediaFiles: [],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // Save to Firestore
      final createdNote = await _firestoreService.createNote(newNote);
      
      // Update local state
      final updatedNotes = List<Note>.from(_notes.value)
        ..add(createdNote);
      _notes.value = updatedNotes;
      
      return createdNote;
    } catch (e) {
      _error.value = 'Failed to create note';
      print('Create note error: $e');
      return null;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Update a note
  Future<bool> updateNote(Note note) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      await _firestoreService.updateNote(note);
      
      // Update local state
      final index = _notes.value.indexWhere((n) => n.id == note.id);
      if (index != -1) {
        final updatedNotes = List<Note>.from(_notes.value);
        updatedNotes[index] = note;
        _notes.value = updatedNotes;
        
        // Update selected note if needed
        if (_selectedNote.value?.id == note.id) {
          _selectedNote.value = note;
        }
        
        // Update in recent notes if present
        final recentIndex = _recentNotes.value.indexWhere((n) => n.id == note.id);
        if (recentIndex != -1) {
          final updatedRecent = List<Note>.from(_recentNotes.value);
          updatedRecent[recentIndex] = note;
          _recentNotes.value = updatedRecent;
        }
      }
      
      return true;
    } catch (e) {
      _error.value = 'Failed to update note';
      print('Update note error: $e');
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Delete a note
  Future<bool> deleteNote(Note note) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      await _firestoreService.deleteNote(note);
      
      // Update local state
      final updatedNotes = _notes.value.where((n) => n.id != note.id).toList();
      _notes.value = updatedNotes;
      
      // Remove from recent notes if present
      final updatedRecent = _recentNotes.value.where((n) => n.id != note.id).toList();
      _recentNotes.value = updatedRecent;
      
      // Clear selected note if it was deleted
      if (_selectedNote.value?.id == note.id) {
        _selectedNote.value = null;
      }
      
      return true;
    } catch (e) {
      _error.value = 'Failed to delete note';
      print('Delete note error: $e');
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Reorder notes
  Future<bool> reorderNotes(List<Note> orderedNotes) async {
    _error.value = null;
    
    try {
      // Update positions based on new order
      final notes = orderedNotes.asMap().entries.map((entry) {
        return entry.value.copyWith(position: entry.key);
      }).toList();
      
      // Update local state immediately for responsive UI
      _notes.value = notes;
      
      // Save to Firestore
      if (notes.isNotEmpty) {
        await _firestoreService.reorderNotes(notes[0].moduleId, notes);
      }
      
      return true;
    } catch (e) {
      // Revert to previous state on error
      _error.value = 'Failed to reorder notes';
      print('Reorder notes error: $e');
      return false;
    }
  }
  
  // Select a note
  void selectNote(Note? note) {
    _selectedNote.value = note;
  }
  
  // Select note by ID
  Future<bool> selectNoteById(String noteId) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      // First check if note is already loaded
      final note = _notes.value.firstWhere(
        (n) => n.id == noteId,
      );
      
      if (note != null) {
        _selectedNote.value = note;
        return true;
      }
      
      // If not loaded, fetch from Firestore
      final fetchedNote = await _firestoreService.getNote(noteId);
      
      if (fetchedNote != null) {
        _selectedNote.value = fetchedNote;
        return true;
      } else {
        _error.value = 'Note not found';
        return false;
      }
    } catch (e) {
      _error.value = 'Failed to load note';
      print('Select note error: $e');
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Upload media file
  Future<MediaItem?> uploadMedia(File file, String userId, String noteId) async {
    _isUploading.value = true;
    _uploadProgress.value = 0;
    _error.value = null;
    
    try {
      // Upload file
      final mediaItem = await _storageService.uploadFile(file, userId, noteId);
      
      // Update note with new media if it's the selected note
      if (_selectedNote.value?.id == noteId) {
        final updatedNote = _selectedNote.value!.copyWith(
          mediaFiles: [..._selectedNote.value!.mediaFiles, mediaItem],
        );
        _selectedNote.value = updatedNote;
      }
      
      _uploadProgress.value = 1.0;
      return mediaItem;
    } catch (e) {
      _error.value = 'Failed to upload file';
      print('Upload media error: $e');
      return null;
    } finally {
      _isUploading.value = false;
    }
  }
  
  // Delete media file
  Future<bool> deleteMedia(MediaItem mediaItem, String userId, String noteId) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      await _storageService.deleteFile(mediaItem, userId, noteId);
      
      // Update note if it's the selected note
      if (_selectedNote.value?.id == noteId) {
        final updatedMediaFiles = _selectedNote.value!.mediaFiles
            .where((m) => m.id != mediaItem.id)
            .toList();
        
        final updatedNote = _selectedNote.value!.copyWith(
          mediaFiles: updatedMediaFiles,
        );
        
        _selectedNote.value = updatedNote;
      }
      
      return true;
    } catch (e) {
      _error.value = 'Failed to delete file';
      print('Delete media error: $e');
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
}