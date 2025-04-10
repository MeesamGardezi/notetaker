// notetaker_frontend/lib/notifiers/theme_notifier.dart
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeNotifier {
  static const String _themeKey = 'app_theme';
  
  // Theme state
  final ValueNotifier<ThemeMode> _themeMode = ValueNotifier<ThemeMode>(ThemeMode.light);
  
  // Expose notifier as read-only
  ValueListenable<ThemeMode> get themeMode => _themeMode;
  
  ThemeNotifier() {
    _loadTheme();
  }
  
  // Load saved theme
  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeIndex = prefs.getInt(_themeKey) ?? 0;
      _themeMode.value = ThemeMode.values[themeIndex];
    } catch (e) {
      print('Error loading theme: $e');
    }
  }
  
  // Toggle between light and dark theme
  Future<void> toggleTheme() async {
    try {
      final newMode = _themeMode.value == ThemeMode.light 
        ? ThemeMode.dark 
        : ThemeMode.light;
      
      _themeMode.value = newMode;
      
      // Save theme preference
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_themeKey, newMode.index);
    } catch (e) {
      print('Error toggling theme: $e');
    }
  }
  
  // Set specific theme mode
  Future<void> setThemeMode(ThemeMode mode) async {
    try {
      _themeMode.value = mode;
      
      // Save theme preference
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_themeKey, mode.index);
    } catch (e) {
      print('Error setting theme: $e');
    }
  }
}