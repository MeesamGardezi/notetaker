import 'dart:ui';

import 'package:flutter/foundation.dart';
import '../config/constants.dart';
import '../models/module.dart';
import '../services/firestore_service.dart';

class ModuleNotifier {
  final FirestoreService _firestoreService;
  
  // Module state
  final ValueNotifier<List<Module>> _modules = ValueNotifier<List<Module>>([]);
  final ValueNotifier<Module?> _selectedModule = ValueNotifier<Module?>(null);
  final ValueNotifier<bool> _isLoading = ValueNotifier<bool>(false);
  final ValueNotifier<String?> _error = ValueNotifier<String?>(null);
  
  // Expose notifiers as read-only
  ValueListenable<List<Module>> get modules => _modules;
  ValueListenable<Module?> get selectedModule => _selectedModule;
  ValueListenable<bool> get isLoading => _isLoading;
  ValueListenable<String?> get error => _error;
  
  ModuleNotifier(this._firestoreService);
  
  // Load modules for a user
  Future<void> loadModules(String userId) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      final modulesList = await _firestoreService.getUserModules(userId);
      _modules.value = modulesList;
    } catch (e) {
      _error.value = 'Failed to load modules';
      print('Load modules error: $e');
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Create a module
  Future<Module?> createModule(String name, String description, String userId, [Color? color]) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      // Determine module position (add to end)
      final position = _modules.value.length;
      
      // Create new module
      final newModule = Module(
        id: '', // Will be assigned by Firestore
        name: name,
        description: description,
        color: color ?? AppTheme.moduleColors[0],
        position: position,
        userId: userId,
        noteCount: 0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // Save to Firestore
      final createdModule = await _firestoreService.createModule(newModule);
      
      // Update local state
      final updatedModules = List<Module>.from(_modules.value)
        ..add(createdModule);
      _modules.value = updatedModules;
      
      return createdModule;
    } catch (e) {
      _error.value = 'Failed to create module';
      print('Create module error: $e');
      return null;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Update a module
  Future<bool> updateModule(Module module) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      await _firestoreService.updateModule(module);
      
      // Update local state
      final index = _modules.value.indexWhere((m) => m.id == module.id);
      if (index != -1) {
        final updatedModules = List<Module>.from(_modules.value);
        updatedModules[index] = module;
        _modules.value = updatedModules;
        
        // Update selected module if needed
        if (_selectedModule.value?.id == module.id) {
          _selectedModule.value = module;
        }
      }
      
      return true;
    } catch (e) {
      _error.value = 'Failed to update module';
      print('Update module error: $e');
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Delete a module
  Future<bool> deleteModule(Module module) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      await _firestoreService.deleteModule(module);
      
      // Update local state
      final updatedModules = _modules.value.where((m) => m.id != module.id).toList();
      _modules.value = updatedModules;
      
      // Clear selected module if it was deleted
      if (_selectedModule.value?.id == module.id) {
        _selectedModule.value = null;
      }
      
      return true;
    } catch (e) {
      _error.value = 'Failed to delete module';
      print('Delete module error: $e');
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Reorder modules
  Future<bool> reorderModules(List<Module> orderedModules) async {
    _error.value = null;
    
    try {
      // Update positions based on new order
      final modules = orderedModules.asMap().entries.map((entry) {
        return entry.value.copyWith(position: entry.key);
      }).toList();
      
      // Update local state immediately for responsive UI
      _modules.value = modules;
      
      // Save to Firestore
      await _firestoreService.reorderModules(modules[0].userId, modules);
      
      return true;
    } catch (e) {
      // Revert to previous state on error
      _error.value = 'Failed to reorder modules';
      print('Reorder modules error: $e');
      return false;
    }
  }
  
  // Select a module
  void selectModule(Module? module) {
    _selectedModule.value = module;
  }
  
  // Select module by ID
  Future<bool> selectModuleById(String moduleId) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      // First check if module is already loaded
      final module = _modules.value.firstWhere(
        (m) => m.id == moduleId,
      );
      
      if (module != null) {
        _selectedModule.value = module;
        return true;
      }
      
      // If not loaded, fetch from Firestore
      final fetchedModule = await _firestoreService.getModule(moduleId);
      
      if (fetchedModule != null) {
        _selectedModule.value = fetchedModule;
        return true;
      } else {
        _error.value = 'Module not found';
        return false;
      }
    } catch (e) {
      _error.value = 'Failed to load module';
      print('Select module error: $e');
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
}