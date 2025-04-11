import 'package:flutter/foundation.dart';
import '../models/note_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class NotesState {
  final ApiService apiService;
  final StorageService storageService;
  
  // State notifiers
  final ValueNotifier<List<NoteModel>> notes = ValueNotifier<List<NoteModel>>([]);
  final ValueNotifier<List<NoteModel>> recentNotes = ValueNotifier<List<NoteModel>>([]);
  final ValueNotifier<List<NoteModel>> starredNotes = ValueNotifier<List<NoteModel>>([]);
  final ValueNotifier<NoteModel?> currentNote = ValueNotifier<NoteModel?>(null);
  final ValueNotifier<bool> isLoading = ValueNotifier<bool>(false);
  final ValueNotifier<String?> errorMessage = ValueNotifier<String?>(null);
  final ValueNotifier<bool> includeArchived = ValueNotifier<bool>(false);
  
  NotesState({
    required this.apiService,
    required this.storageService,
  });
  
  // Load notes for a specific module
  Future<void> loadModuleNotes(String moduleId) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final notesData = await apiService.getModuleNotes(
        moduleId,
        includeArchived: includeArchived.value
      );
      
      final loadedNotes = notesData
          .map((json) => NoteModel.fromJson(json))
          .toList();
      
      // Sort by sortOrder
      loadedNotes.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      
      notes.value = loadedNotes;
      
      // Cache notes data
      await _cacheNotes(moduleId);
    } catch (e) {
      errorMessage.value = 'Failed to load notes: ${e.toString()}';
      
      // Try to load from cache if API fails
      await _loadFromCache(moduleId);
    } finally {
      isLoading.value = false;
    }
  }
  
  // Load recent notes
  Future<void> loadRecentNotes({int limit = 10}) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final notesData = await apiService.getRecentNotes(limit: limit);
      
      final loadedNotes = notesData
          .map((json) => NoteModel.fromJson(json))
          .toList();
      
      recentNotes.value = loadedNotes;
      
      // Cache recent notes
      await storageService.setCachedData(
        'recent_notes', 
        loadedNotes.map((note) => note.toJson()).toList(),
        expiration: const Duration(hours: 1)
      );
    } catch (e) {
      errorMessage.value = 'Failed to load recent notes: ${e.toString()}';
      
      // Try to load from cache
      try {
        final cachedData = await storageService.getCachedData('recent_notes');
        if (cachedData != null) {
          final loadedNotes = (cachedData as List)
              .map((json) => NoteModel.fromJson(json))
              .toList();
          recentNotes.value = loadedNotes;
        }
      } catch (_) {
        // Silently handle cache loading errors
      }
    } finally {
      isLoading.value = false;
    }
  }
  
  // Load starred notes
  Future<void> loadStarredNotes() async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final notesData = await apiService.getStarredNotes(
        includeArchived: includeArchived.value
      );
      
      final loadedNotes = notesData
          .map((json) => NoteModel.fromJson(json))
          .toList();
      
      starredNotes.value = loadedNotes;
      
      // Cache starred notes
      await storageService.setCachedData(
        'starred_notes', 
        loadedNotes.map((note) => note.toJson()).toList(),
        expiration: const Duration(hours: 1)
      );
    } catch (e) {
      errorMessage.value = 'Failed to load starred notes: ${e.toString()}';
      
      // Try to load from cache
      try {
        final cachedData = await storageService.getCachedData('starred_notes');
        if (cachedData != null) {
          final loadedNotes = (cachedData as List)
              .map((json) => NoteModel.fromJson(json))
              .toList();
          starredNotes.value = loadedNotes;
        }
      } catch (_) {
        // Silently handle cache loading errors
      }
    } finally {
      isLoading.value = false;
    }
  }
  
  // Load a specific note
  Future<NoteModel?> loadNote(String noteId) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final noteData = await apiService.getNote(noteId);
      
      final loadedNote = NoteModel.fromJson(noteData);
      currentNote.value = loadedNote;
      
      // Cache the note
      await storageService.setCachedData(
        'note_$noteId', 
        loadedNote.toJson(),
        expiration: const Duration(hours: 1)
      );
      
      return loadedNote;
    } catch (e) {
      errorMessage.value = 'Failed to load note: ${e.toString()}';
      
      // Try to load from cache
      try {
        final cachedData = await storageService.getCachedData('note_$noteId');
        if (cachedData != null) {
          final loadedNote = NoteModel.fromJson(cachedData);
          currentNote.value = loadedNote;
          return loadedNote;
        }
      } catch (_) {
        // Silently handle cache loading errors
      }
      
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Create a new note
  Future<NoteModel?> createNote(String moduleId, String title, {
    Map<String, dynamic>? content,
    List<String>? tags,
    bool isStarred = false,
  }) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final response = await apiService.createNote(
        moduleId,
        title,
        content: content,
        tags: tags,
        isStarred: isStarred,
      );
      
      final newNote = NoteModel.fromJson(response['note']);
      
      // Add to current list if we're viewing the same module
      if (notes.value.isNotEmpty && notes.value.first.moduleId == moduleId) {
        final updatedNotes = List<NoteModel>.from(notes.value);
        updatedNotes.add(newNote);
        
        // Sort by sortOrder
        updatedNotes.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
        
        notes.value = updatedNotes;
        await _cacheNotes(moduleId);
      }
      
      // If starred, add to starred notes
      if (isStarred) {
        final updatedStarred = List<NoteModel>.from(starredNotes.value);
        updatedStarred.add(newNote);
        starredNotes.value = updatedStarred;
      }
      
      // Add to recent notes
      final updatedRecent = List<NoteModel>.from(recentNotes.value);
      updatedRecent.insert(0, newNote); // Add to beginning
      
      // Limit to 10 notes
      if (updatedRecent.length > 10) {
        updatedRecent.removeLast();
      }
      
      recentNotes.value = updatedRecent;
      
      return newNote;
    } catch (e) {
      errorMessage.value = 'Failed to create note: ${e.toString()}';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Update an existing note
  Future<NoteModel?> updateNote(String noteId, {
    String? title,
    Map<String, dynamic>? content,
    List<String>? tags,
    bool? isStarred,
    bool? isArchived,
    String? moduleId,
    int? sortOrder,
  }) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final response = await apiService.updateNote(
        noteId,
        title: title,
        content: content,
        tags: tags,
        isStarred: isStarred,
        isArchived: isArchived,
        moduleId: moduleId,
        sortOrder: sortOrder,
      );
      
      final updatedNote = NoteModel.fromJson(response['note']);
      
      // Update current note if it's the one being edited
      if (currentNote.value?.id == noteId) {
        currentNote.value = updatedNote;
      }
      
      // Update in notes list if present
      final notesIndex = notes.value.indexWhere((note) => note.id == noteId);
      if (notesIndex >= 0) {
        final updatedNotes = List<NoteModel>.from(notes.value);
        
        // If module changed, remove from current list
        if (moduleId != null && moduleId != updatedNotes[notesIndex].moduleId) {
          updatedNotes.removeAt(notesIndex);
        } else {
          updatedNotes[notesIndex] = updatedNote;
        }
        
        notes.value = updatedNotes;
        await _cacheNotes(updatedNote.moduleId);
      }
      
      // Update in starred notes if present
      final starredIndex = starredNotes.value.indexWhere((note) => note.id == noteId);
      if (starredIndex >= 0) {
        final updatedStarred = List<NoteModel>.from(starredNotes.value);
        
        // If star status changed to false, remove from starred
        if (isStarred == false) {
          updatedStarred.removeAt(starredIndex);
        } else {
          updatedStarred[starredIndex] = updatedNote;
        }
        
        starredNotes.value = updatedStarred;
      } else if (isStarred == true) {
        // Add to starred if not present but now starred
        final updatedStarred = List<NoteModel>.from(starredNotes.value);
        updatedStarred.add(updatedNote);
        starredNotes.value = updatedStarred;
      }
      
      // Update in recent notes if present
      final recentIndex = recentNotes.value.indexWhere((note) => note.id == noteId);
      if (recentIndex >= 0) {
        final updatedRecent = List<NoteModel>.from(recentNotes.value);
        updatedRecent[recentIndex] = updatedNote;
        
        // Move to top of recent list
        if (recentIndex > 0) {
          updatedRecent.removeAt(recentIndex);
          updatedRecent.insert(0, updatedNote);
        }
        
        recentNotes.value = updatedRecent;
      }
      
      return updatedNote;
    } catch (e) {
      errorMessage.value = 'Failed to update note: ${e.toString()}';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Delete a note
  Future<bool> deleteNote(String noteId) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      await apiService.deleteNote(noteId);
      
      // Remove from all lists
      
      // Current note
      if (currentNote.value?.id == noteId) {
        currentNote.value = null;
      }
      
      // Notes list
      final updatedNotes = notes.value.where((note) => note.id != noteId).toList();
      notes.value = updatedNotes;
      
      // Starred notes
      final updatedStarred = starredNotes.value.where((note) => note.id != noteId).toList();
      starredNotes.value = updatedStarred;
      
      // Recent notes
      final updatedRecent = recentNotes.value.where((note) => note.id != noteId).toList();
      recentNotes.value = updatedRecent;
      
      // Remove from cache
      await storageService.getCachedData('note_$noteId');
      
      return true;
    } catch (e) {
      errorMessage.value = 'Failed to delete note: ${e.toString()}';
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Search notes
  Future<List<NoteModel>> searchNotes(String query, {String? moduleId}) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final notesData = await apiService.searchNotes(query, moduleId: moduleId);
      
      final searchResults = notesData
          .map((json) => NoteModel.fromJson(json))
          .toList();
      
      return searchResults;
    } catch (e) {
      errorMessage.value = 'Search failed: ${e.toString()}';
      return [];
    } finally {
      isLoading.value = false;
    }
  }
  
  // Toggle include archived option
  Future<void> toggleIncludeArchived() async {
    includeArchived.value = !includeArchived.value;
    
    // Reload current data
    if (notes.value.isNotEmpty) {
      final moduleId = notes.value.first.moduleId;
      await loadModuleNotes(moduleId);
    }
    
    await loadStarredNotes();
  }
  
  // Load from cache
  Future<void> _loadFromCache(String moduleId) async {
    try {
      final cachedData = await storageService.getCachedData('notes_$moduleId');
      if (cachedData != null) {
        final loadedNotes = (cachedData as List)
            .map((json) => NoteModel.fromJson(json))
            .toList();
        
        loadedNotes.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
        notes.value = loadedNotes;
      }
    } catch (e) {
      // Silently handle cache loading errors
    }
  }
  
  // Cache current notes
  Future<void> _cacheNotes(String moduleId) async {
    try {
      final notesJson = notes.value.map((n) => n.toJson()).toList();
      await storageService.setCachedData(
        'notes_$moduleId', 
        notesJson,
        expiration: const Duration(hours: 1)
      );
    } catch (e) {
      // Silently handle cache saving errors
    }
  }
  
  // Dispose resources
  void dispose() {
    notes.dispose();
    recentNotes.dispose();
    starredNotes.dispose();
    currentNote.dispose();
    isLoading.dispose();
    errorMessage.dispose();
    includeArchived.dispose();
  }
}