import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../state/auth_state.dart';

class AppState {
  final AuthState authState;
  final ApiService apiService;
  final StorageService storageService;
  
  // Global application state using ValueNotifier for reactivity
  final ValueNotifier<bool> isLoading = ValueNotifier<bool>(false);
  final ValueNotifier<String?> errorMessage = ValueNotifier<String?>(null);
  final ValueNotifier<double> textScaleFactor = ValueNotifier<double>(1.0);
  final ValueNotifier<bool> isDarkMode = ValueNotifier<bool>(false);
  
  AppState({
    required this.authState,
    required this.apiService,
    required this.storageService,
  }) {
    _initialize();
  }
  
  void _initialize() async {
    // Initialize text scale factor from settings
    final user = authState.user;
    if (user != null) {
      final fontSize = user.getFontSizePreference();
      textScaleFactor.value = fontSize / 16.0; // Base font size is 16.0
    }
    
    // Initialize theme mode from settings
    final savedThemeMode = await storageService.getThemeMode();
    isDarkMode.value = savedThemeMode == ThemeMode.dark;
    
    // Listen for auth changes
    authState.addListener(_handleAuthStateChange);
  }
  
  void _handleAuthStateChange() {
    final user = authState.user;
    if (user != null) {
      // Update text scale factor when user settings change
      final fontSize = user.getFontSizePreference();
      textScaleFactor.value = fontSize / 16.0;
    }
  }
  
  // Set loading state
  void setLoading(bool loading) {
    isLoading.value = loading;
  }
  
  // Set error message
  void setErrorMessage(String? message) {
    errorMessage.value = message;
    
    // Auto-clear error message after 5 seconds
    if (message != null) {
      Future.delayed(const Duration(seconds: 5), () {
        if (errorMessage.value == message) {
          errorMessage.value = null;
        }
      });
    }
  }
  
  // Toggle theme mode
  Future<void> toggleDarkMode() async {
    isDarkMode.value = !isDarkMode.value;
    await storageService.setThemeMode(
      isDarkMode.value ? ThemeMode.dark : ThemeMode.light
    );
    
    // Update user settings if logged in
    if (authState.isLoggedIn) {
      final settings = {...?authState.user?.settings};
      settings['theme'] = isDarkMode.value ? 'dark' : 'light';
      authState.updateProfile(settings: settings);
    }
  }
  
  // Update text scale factor
  Future<void> updateTextScaleFactor(double factor) async {
    textScaleFactor.value = factor;
    
    // Update user settings if logged in
    if (authState.isLoggedIn) {
      final fontSize = 16.0 * factor;
      final settings = {...?authState.user?.settings};
      settings['fontSizePreference'] = fontSize;
      authState.updateProfile(settings: settings);
    }
  }
  
  // Dispose resources
  void dispose() {
    authState.removeListener(_handleAuthStateChange);
    isLoading.dispose();
    errorMessage.dispose();
    textScaleFactor.dispose();
    isDarkMode.dispose();
  }
}