import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/note_model.dart';
import '../services/api_service.dart';

/// Manages state for the rich text editor
class EditorState {
  final ApiService apiService;
  
  // Note being edited
  final ValueNotifier<NoteModel?> note = ValueNotifier<NoteModel?>(null);
  
  // Editor-specific state
  final ValueNotifier<bool> isEditing = ValueNotifier<bool>(false);
  final ValueNotifier<bool> isSaving = ValueNotifier<bool>(false);
  final ValueNotifier<bool> hasChanges = ValueNotifier<bool>(false);
  final ValueNotifier<String?> errorMessage = ValueNotifier<String?>(null);
  
  // Title controller
  late TextEditingController titleController;
  
  // Content state
  final ValueNotifier<List<Map<String, dynamic>>> blocks = ValueNotifier<List<Map<String, dynamic>>>([]);
  
  // Auto-save timer
  Timer? _autoSaveTimer;
  final Duration _autoSaveDuration = const Duration(seconds: 5);
  
  // Callbacks
  final Function(NoteModel updatedNote)? onNoteSaved;
  
  EditorState({
    required this.apiService,
    this.onNoteSaved,
  }) {
    titleController = TextEditingController();
    titleController.addListener(_handleTextChanges);
  }
  
  // Initialize editor with a note
  void initWithNote(NoteModel noteToEdit) {
    // Set note
    note.value = noteToEdit;
    
    // Set title
    titleController.text = noteToEdit.title;
    
    // Set blocks
    final noteBlocks = noteToEdit.content['blocks'] ?? [];
    blocks.value = List<Map<String, dynamic>>.from(noteBlocks);
    
    // Reset state
    isEditing.value = false;
    hasChanges.value = false;
    errorMessage.value = null;
  }
  
  // Start editing session
  void startEditing() {
    isEditing.value = true;
  }
  
  // Handle text changes
  void _handleTextChanges() {
    if (isEditing.value) {
      hasChanges.value = true;
      _scheduleAutoSave();
    }
  }
  
  // Handle block changes
  void updateBlocks(List<Map<String, dynamic>> newBlocks) {
    if (isEditing.value) {
      blocks.value = List<Map<String, dynamic>>.from(newBlocks);
      hasChanges.value = true;
      _scheduleAutoSave();
    }
  }
  
  // Update single block
  void updateBlock(int index, Map<String, dynamic> updatedBlock) {
    if (isEditing.value && index >= 0 && index < blocks.value.length) {
      final newBlocks = List<Map<String, dynamic>>.from(blocks.value);
      newBlocks[index] = updatedBlock;
      blocks.value = newBlocks;
      hasChanges.value = true;
      _scheduleAutoSave();
    }
  }
  
  // Add new block
  void addBlock(Map<String, dynamic> block, {int? atIndex}) {
    if (isEditing.value) {
      final newBlocks = List<Map<String, dynamic>>.from(blocks.value);
      if (atIndex != null && atIndex >= 0 && atIndex <= newBlocks.length) {
        newBlocks.insert(atIndex, block);
      } else {
        newBlocks.add(block);
      }
      blocks.value = newBlocks;
      hasChanges.value = true;
      _scheduleAutoSave();
    }
  }
  
  // Remove block
  void removeBlock(int index) {
    if (isEditing.value && index >= 0 && index < blocks.value.length) {
      final newBlocks = List<Map<String, dynamic>>.from(blocks.value);
      newBlocks.removeAt(index);
      blocks.value = newBlocks;
      hasChanges.value = true;
      _scheduleAutoSave();
    }
  }
  
  // Move block
  void moveBlock(int oldIndex, int newIndex) {
    if (isEditing.value && 
        oldIndex >= 0 && oldIndex < blocks.value.length &&
        newIndex >= 0 && newIndex < blocks.value.length) {
      final newBlocks = List<Map<String, dynamic>>.from(blocks.value);
      final block = newBlocks.removeAt(oldIndex);
      newBlocks.insert(newIndex, block);
      blocks.value = newBlocks;
      hasChanges.value = true;
      _scheduleAutoSave();
    }
  }
  
  // Schedule auto-save
  void _scheduleAutoSave() {
    // Cancel previous timer
    _autoSaveTimer?.cancel();
    
    // Schedule new save
    _autoSaveTimer = Timer(_autoSaveDuration, () {
      if (hasChanges.value) {
        saveChanges();
      }
    });
  }
  
  // Extract plain text from blocks for search
  String _extractPlainText() {
    final buffer = StringBuffer();
    
    for (final block in blocks.value) {
      if (block['content'] != null) {
        if (buffer.isNotEmpty) {
          buffer.write(' ');
        }
        buffer.write(block['content']);
      }
    }
    
    return buffer.toString();
  }
  
  // Save changes
  Future<bool> saveChanges() async {
    if (!hasChanges.value || note.value == null) {
      return true;
    }
    
    isSaving.value = true;
    errorMessage.value = null;
    
    try {
      // Prepare content
      final plainText = _extractPlainText();
      final content = {
        'blocks': blocks.value,
        'version': '1.0',
        'plainText': plainText,
      };
      
      // Save to API
      final updatedNote = await apiService.updateNote(
        note.value!.id,
        title: titleController.text,
        content: content,
      );
      
      if (updatedNote != null) {
        // Update local note
        note.value = NoteModel.fromJson(updatedNote['note']);
        
        // Reset state
        hasChanges.value = false;
        
        // Call callback if provided
        if (onNoteSaved != null) {
          onNoteSaved!(note.value!);
        }
        
        isSaving.value = false;
        return true;
      } else {
        errorMessage.value = 'Failed to save changes';
        isSaving.value = false;
        return false;
      }
    } catch (e) {
      errorMessage.value = 'Error saving changes: ${e.toString()}';
      isSaving.value = false;
      return false;
    }
  }
  
  // Toggle star status
  Future<bool> toggleStar() async {
    if (note.value == null) {
      return false;
    }
    
    isSaving.value = true;
    errorMessage.value = null;
    
    try {
      final isStarred = !(note.value!.isStarred);
      
      final updatedNote = await apiService.updateNote(
        note.value!.id,
        isStarred: isStarred,
      );
      
      if (updatedNote != null) {
        // Update local note
        note.value = NoteModel.fromJson(updatedNote['note']);
        
        // Call callback if provided
        if (onNoteSaved != null) {
          onNoteSaved!(note.value!);
        }
        
        isSaving.value = false;
        return true;
      } else {
        errorMessage.value = 'Failed to update star status';
        isSaving.value = false;
        return false;
      }
    } catch (e) {
      errorMessage.value = 'Error updating star status: ${e.toString()}';
      isSaving.value = false;
      return false;
    }
  }
  
  // Toggle archive status
  Future<bool> toggleArchive() async {
    if (note.value == null) {
      return false;
    }
    
    isSaving.value = true;
    errorMessage.value = null;
    
    try {
      final isArchived = !(note.value!.isArchived);
      
      final updatedNote = await apiService.updateNote(
        note.value!.id,
        isArchived: isArchived,
      );
      
      if (updatedNote != null) {
        // Update local note
        note.value = NoteModel.fromJson(updatedNote['note']);
        
        // Call callback if provided
        if (onNoteSaved != null) {
          onNoteSaved!(note.value!);
        }
        
        isSaving.value = false;
        return true;
      } else {
        errorMessage.value = 'Failed to update archive status';
        isSaving.value = false;
        return false;
      }
    } catch (e) {
      errorMessage.value = 'Error updating archive status: ${e.toString()}';
      isSaving.value = false;
      return false;
    }
  }
  
  // Update note tags
  Future<bool> updateTags(List<String> tagIds) async {
    if (note.value == null) {
      return false;
    }
    
    isSaving.value = true;
    errorMessage.value = null;
    
    try {
      final updatedNote = await apiService.updateNote(
        note.value!.id,
        tags: tagIds,
      );
      
      if (updatedNote != null) {
        // Update local note
        note.value = NoteModel.fromJson(updatedNote['note']);
        
        // Call callback if provided
        if (onNoteSaved != null) {
          onNoteSaved!(note.value!);
        }
        
        isSaving.value = false;
        return true;
      } else {
        errorMessage.value = 'Failed to update tags';
        isSaving.value = false;
        return false;
      }
    } catch (e) {
      errorMessage.value = 'Error updating tags: ${e.toString()}';
      isSaving.value = false;
      return false;
    }
  }
  
  // Move note to another module
  Future<bool> moveToModule(String moduleId) async {
    if (note.value == null) {
      return false;
    }
    
    isSaving.value = true;
    errorMessage.value = null;
    
    try {
      final updatedNote = await apiService.updateNote(
        note.value!.id,
        moduleId: moduleId,
      );
      
      if (updatedNote != null) {
        // Update local note
        note.value = NoteModel.fromJson(updatedNote['note']);
        
        // Call callback if provided
        if (onNoteSaved != null) {
          onNoteSaved!(note.value!);
        }
        
        isSaving.value = false;
        return true;
      } else {
        errorMessage.value = 'Failed to move note';
        isSaving.value = false;
        return false;
      }
    } catch (e) {
      errorMessage.value = 'Error moving note: ${e.toString()}';
      isSaving.value = false;
      return false;
    }
  }
  
  // Create an empty text block
  Map<String, dynamic> createEmptyTextBlock() {
    return {
      'id': 'block_${DateTime.now().millisecondsSinceEpoch}',
      'type': 'text',
      'content': '',
      'formatting': [],
    };
  }
  
  // Create a heading block
  Map<String, dynamic> createHeadingBlock(String text, {int level = 1}) {
    return {
      'id': 'block_${DateTime.now().millisecondsSinceEpoch}',
      'type': 'heading',
      'content': text,
      'formatting': [],
      'metadata': {
        'level': level,
      },
    };
  }
  
  // Create a list block
  Map<String, dynamic> createListBlock(List<String> items, {bool ordered = false}) {
    return {
      'id': 'block_${DateTime.now().millisecondsSinceEpoch}',
      'type': 'list',
      'content': items.join('\n'),
      'formatting': [],
      'metadata': {
        'ordered': ordered,
      },
    };
  }
  
  // Clear resources
  void dispose() {
    _autoSaveTimer?.cancel();
    titleController.dispose();
    note.dispose();
    isEditing.dispose();
    isSaving.dispose();
    hasChanges.dispose();
    errorMessage.dispose();
    blocks.dispose();
  }
}