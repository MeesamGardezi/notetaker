import 'package:flutter/foundation.dart';
import '../models/tag_model.dart';
import '../models/note_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class TagsState {
  final ApiService apiService;
  final StorageService storageService;
  
  // State notifiers
  final ValueNotifier<List<TagModel>> tags = ValueNotifier<List<TagModel>>([]);
  final ValueNotifier<TagModel?> currentTag = ValueNotifier<TagModel?>(null);
  final ValueNotifier<List<NoteModel>> taggedNotes = ValueNotifier<List<NoteModel>>([]);
  final ValueNotifier<bool> isLoading = ValueNotifier<bool>(false);
  final ValueNotifier<String?> errorMessage = ValueNotifier<String?>(null);
  final ValueNotifier<bool> includeArchived = ValueNotifier<bool>(false);
  
  TagsState({
    required this.apiService,
    required this.storageService,
  });
  
  // Load all tags
  Future<void> loadTags() async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final tagsData = await apiService.getTags();
      
      final loadedTags = tagsData
          .map((json) => TagModel.fromJson(json))
          .toList();
      
      // Sort by name alphabetically
      loadedTags.sort((a, b) => a.name.compareTo(b.name));
      
      tags.value = loadedTags;
      
      // Cache tags data
      await _cacheTags();
    } catch (e) {
      errorMessage.value = 'Failed to load tags: ${e.toString()}';
      
      // Try to load from cache if API fails
      await _loadFromCache();
    } finally {
      isLoading.value = false;
    }
  }
  
  // Load notes by tag
  Future<void> loadNotesByTag(String tagId) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final response = await apiService.getNotesByTag(
        tagId,
        includeArchived: includeArchived.value
      );
      
      final tag = TagModel.fromJson(response['tag']);
      currentTag.value = tag;
      
      final notesData = response['notes'] as List;
      final loadedNotes = notesData
          .map((json) => NoteModel.fromJson(json))
          .toList();
      
      taggedNotes.value = loadedNotes;
      
      // Cache tag and its notes
      await storageService.setCachedData(
        'tag_$tagId', 
        {
          'tag': tag.toJson(),
          'notes': loadedNotes.map((note) => note.toJson()).toList(),
        },
        expiration: const Duration(hours: 1)
      );
    } catch (e) {
      errorMessage.value = 'Failed to load notes for tag: ${e.toString()}';
      
      // Try to load from cache
      try {
        final cachedData = await storageService.getCachedData('tag_$tagId');
        if (cachedData != null) {
          final tag = TagModel.fromJson(cachedData['tag']);
          currentTag.value = tag;
          
          final loadedNotes = (cachedData['notes'] as List)
              .map((json) => NoteModel.fromJson(json))
              .toList();
          taggedNotes.value = loadedNotes;
        }
      } catch (_) {
        // Silently handle cache loading errors
      }
    } finally {
      isLoading.value = false;
    }
  }
  
  // Create a new tag
  Future<TagModel?> createTag(String name, {String? color}) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final response = await apiService.createTag(name, color: color);
      
      final newTag = TagModel.fromJson(response['tag']);
      
      // Add to current list
      final updatedTags = List<TagModel>.from(tags.value);
      updatedTags.add(newTag);
      
      // Sort alphabetically
      updatedTags.sort((a, b) => a.name.compareTo(b.name));
      
      tags.value = updatedTags;
      await _cacheTags();
      
      return newTag;
    } catch (e) {
      errorMessage.value = 'Failed to create tag: ${e.toString()}';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Update an existing tag
  Future<TagModel?> updateTag(String tagId, {String? name, String? color}) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final response = await apiService.updateTag(tagId, name: name, color: color);
      
      final updatedTag = TagModel.fromJson(response['tag']);
      
      // Update in current list
      final index = tags.value.indexWhere((tag) => tag.id == tagId);
      if (index >= 0) {
        final updatedTags = List<TagModel>.from(tags.value);
        updatedTags[index] = updatedTag;
        
        // Sort alphabetically if name changed
        if (name != null) {
          updatedTags.sort((a, b) => a.name.compareTo(b.name));
        }
        
        tags.value = updatedTags;
        await _cacheTags();
      }
      
      // Update current tag if it's the one being edited
      if (currentTag.value?.id == tagId) {
        currentTag.value = updatedTag;
      }
      
      return updatedTag;
    } catch (e) {
      errorMessage.value = 'Failed to update tag: ${e.toString()}';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Delete a tag
  Future<bool> deleteTag(String tagId) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      await apiService.deleteTag(tagId);
      
      // Remove from current list
      final updatedTags = tags.value.where((tag) => tag.id != tagId).toList();
      tags.value = updatedTags;
      await _cacheTags();
      
      // Clear current tag if it's the one being deleted
      if (currentTag.value?.id == tagId) {
        currentTag.value = null;
        taggedNotes.value = [];
      }
      
      return true;
    } catch (e) {
      errorMessage.value = 'Failed to delete tag: ${e.toString()}';
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Toggle include archived option
  Future<void> toggleIncludeArchived() async {
    includeArchived.value = !includeArchived.value;
    
    // Reload current data if a tag is selected
    if (currentTag.value != null) {
      await loadNotesByTag(currentTag.value!.id);
    }
  }
  
  // Get tag by ID
  TagModel? getTagById(String tagId) {
    return tags.value.firstWhere(
      (tag) => tag.id == tagId,
      orElse: () => null as TagModel,
    );
  }
  
  // Load from cache
  Future<void> _loadFromCache() async {
    try {
      final cachedData = await storageService.getCachedData('tags');
      if (cachedData != null) {
        final loadedTags = (cachedData as List)
            .map((json) => TagModel.fromJson(json))
            .toList();
        
        // Sort alphabetically
        loadedTags.sort((a, b) => a.name.compareTo(b.name));
        
        tags.value = loadedTags;
      }
    } catch (e) {
      // Silently handle cache loading errors
    }
  }
  
  // Cache current tags
  Future<void> _cacheTags() async {
    try {
      final tagsJson = tags.value.map((t) => t.toJson()).toList();
      await storageService.setCachedData(
        'tags', 
        tagsJson,
        expiration: const Duration(days: 1)
      );
    } catch (e) {
      // Silently handle cache saving errors
    }
  }
  
  // Dispose resources
  void dispose() {
    tags.dispose();
    currentTag.dispose();
    taggedNotes.dispose();
    isLoading.dispose();
    errorMessage.dispose();
    includeArchived.dispose();
  }
}