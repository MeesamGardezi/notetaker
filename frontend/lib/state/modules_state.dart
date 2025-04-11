import 'package:flutter/foundation.dart';
import '../models/module_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class ModulesState {
  final ApiService apiService;
  final StorageService storageService;
  
  // State notifiers
  final ValueNotifier<List<ModuleModel>> modules = ValueNotifier<List<ModuleModel>>([]);
  final ValueNotifier<bool> isLoading = ValueNotifier<bool>(false);
  final ValueNotifier<String?> errorMessage = ValueNotifier<String?>(null);
  final ValueNotifier<bool> includeArchived = ValueNotifier<bool>(false);
  
  ModulesState({
    required this.apiService,
    required this.storageService,
  });
  
  // Load modules from API
  Future<void> loadModules() async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final modulesData = await apiService.getModules(
        includeArchived: includeArchived.value
      );
      
      final loadedModules = modulesData
          .map((json) => ModuleModel.fromJson(json))
          .toList();
      
      // Sort by sortOrder
      loadedModules.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      
      modules.value = loadedModules;
      
      // Cache modules data
      await _cacheModules();
    } catch (e) {
      errorMessage.value = 'Failed to load modules: ${e.toString()}';
      
      // Try to load from cache if API fails
      await _loadFromCache();
    } finally {
      isLoading.value = false;
    }
  }
  
  // Load from cache
  Future<void> _loadFromCache() async {
    try {
      final cachedData = await storageService.getCachedData('modules');
      if (cachedData != null) {
        final loadedModules = (cachedData as List)
            .map((json) => ModuleModel.fromJson(json))
            .toList();
        
        loadedModules.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
        modules.value = loadedModules;
      }
    } catch (e) {
      // Silently handle cache loading errors
    }
  }
  
  // Cache current modules
  Future<void> _cacheModules() async {
    try {
      final modulesJson = modules.value.map((m) => m.toJson()).toList();
      await storageService.setCachedData(
        'modules', 
        modulesJson,
        expiration: const Duration(days: 1)
      );
    } catch (e) {
      // Silently handle cache saving errors
    }
  }
  
  // Create a new module
  Future<ModuleModel?> createModule(String title, {
    String? description,
    String? color,
    String? icon,
  }) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final response = await apiService.createModule(
        title,
        description: description,
        color: color,
        icon: icon,
      );
      
      final newModule = ModuleModel.fromJson(response['module']);
      
      // Add to current list
      final updatedModules = List<ModuleModel>.from(modules.value);
      updatedModules.add(newModule);
      
      // Sort by sortOrder
      updatedModules.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      
      modules.value = updatedModules;
      await _cacheModules();
      
      return newModule;
    } catch (e) {
      errorMessage.value = 'Failed to create module: ${e.toString()}';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Update an existing module
  Future<bool> updateModule(String moduleId, {
    String? title,
    String? description,
    String? color,
    String? icon,
    bool? isArchived,
  }) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      final response = await apiService.updateModule(
        moduleId,
        title: title,
        description: description,
        color: color,
        icon: icon,
        isArchived: isArchived,
      );
      
      final updatedModule = ModuleModel.fromJson(response['module']);
      
      // Update in the current list
      final index = modules.value.indexWhere((m) => m.id == moduleId);
      if (index >= 0) {
        final updatedModules = List<ModuleModel>.from(modules.value);
        updatedModules[index] = updatedModule;
        modules.value = updatedModules;
        await _cacheModules();
      }
      
      return true;
    } catch (e) {
      errorMessage.value = 'Failed to update module: ${e.toString()}';
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Delete a module
  Future<bool> deleteModule(String moduleId) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      await apiService.deleteModule(moduleId);
      
      // Remove from current list
      final updatedModules = modules.value.where((m) => m.id != moduleId).toList();
      modules.value = updatedModules;
      await _cacheModules();
      
      return true;
    } catch (e) {
      errorMessage.value = 'Failed to delete module: ${e.toString()}';
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Reorder modules
  Future<bool> reorderModules(List<String> moduleIds) async {
    isLoading.value = true;
    errorMessage.value = null;
    
    try {
      await apiService.reorderModules(moduleIds);
      
      // Update sort order in current list
      final updatedModules = List<ModuleModel>.from(modules.value);
      
      for (int i = 0; i < moduleIds.length; i++) {
        final index = updatedModules.indexWhere((m) => m.id == moduleIds[i]);
        if (index >= 0) {
          updatedModules[index] = updatedModules[index].copyWith(
            sortOrder: i,
            updatedAt: DateTime.now(),
          );
        }
      }
      
      // Sort by new sortOrder
      updatedModules.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      
      modules.value = updatedModules;
      await _cacheModules();
      
      return true;
    } catch (e) {
      errorMessage.value = 'Failed to reorder modules: ${e.toString()}';
      // Try to reload to ensure consistent state
      await loadModules();
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Toggle include archived option
  Future<void> toggleIncludeArchived() async {
    includeArchived.value = !includeArchived.value;
    await loadModules();
  }
  
  // Get a specific module by ID
  ModuleModel? getModuleById(String moduleId) {
    return modules.value.firstWhere(
      (m) => m.id == moduleId,
      orElse: () => null as ModuleModel,
    );
  }
  
  // Update note count for a module
  void updateNoteCount(String moduleId, int count) {
    final index = modules.value.indexWhere((m) => m.id == moduleId);
    if (index >= 0) {
      final updatedModules = List<ModuleModel>.from(modules.value);
      updatedModules[index] = updatedModules[index].copyWith(
        noteCount: count,
        updatedAt: DateTime.now(),
      );
      modules.value = updatedModules;
      _cacheModules();
    }
  }
  
  // Dispose resources
  void dispose() {
    modules.dispose();
    isLoading.dispose();
    errorMessage.dispose();
    includeArchived.dispose();
  }
}