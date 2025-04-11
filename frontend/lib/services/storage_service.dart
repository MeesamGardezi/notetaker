import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  final SharedPreferences prefs;
  final FlutterSecureStorage secureStorage = const FlutterSecureStorage();
  
  // Key strings for storage
  static const String _authTokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';
  static const String _themeModeKey = 'theme_mode';
  static const String _fontSizeKey = 'font_size';
  
  // Stream controllers for reactive state
  final StreamController<ThemeMode> _themeModeController = StreamController<ThemeMode>.broadcast();
  
  // Stream getters
  Stream<ThemeMode> get themePreferenceChanges => _themeModeController.stream;
  
  StorageService({required this.prefs});
  
  // Auth token methods (using secure storage)
  
  Future<String?> getAuthToken() async {
    return await secureStorage.read(key: _authTokenKey);
  }
  
  Future<void> setAuthToken(String token) async {
    await secureStorage.write(key: _authTokenKey, value: token);
  }
  
  Future<void> clearAuthToken() async {
    await secureStorage.delete(key: _authTokenKey);
  }
  
  // User data methods (using shared preferences)
  
  Future<Map<String, dynamic>?> getUserData() async {
    final userData = prefs.getString(_userDataKey);
    if (userData == null) return null;
    
    try {
      return json.decode(userData) as Map<String, dynamic>;
    } catch (e) {
      await prefs.remove(_userDataKey);
      return null;
    }
  }
  
  Future<void> setUserData(Map<String, dynamic> userData) async {
    await prefs.setString(_userDataKey, json.encode(userData));
  }
  
  Future<void> clearUserData() async {
    await prefs.remove(_userDataKey);
  }
  
  // Theme preferences
  
  Future<ThemeMode> getThemeMode() async {
    final themeModeString = prefs.getString(_themeModeKey);
    
    switch (themeModeString) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }
  
  Future<void> setThemeMode(ThemeMode themeMode) async {
    String themeModeString;
    
    switch (themeMode) {
      case ThemeMode.light:
        themeModeString = 'light';
        break;
      case ThemeMode.dark:
        themeModeString = 'dark';
        break;
      case ThemeMode.system:
      default:
        themeModeString = 'system';
        break;
    }
    
    await prefs.setString(_themeModeKey, themeModeString);
    _themeModeController.add(themeMode);
  }
  
  // Font size preferences
  
  Future<double> getFontSize() async {
    return prefs.getDouble(_fontSizeKey) ?? 16.0;
  }
  
  Future<void> setFontSize(double fontSize) async {
    await prefs.setDouble(_fontSizeKey, fontSize);
  }
  
  // Cache management
  
  Future<void> clearCache() async {
    // Clear all data except auth token and user data
    final keys = prefs.getKeys();
    for (final key in keys) {
      if (key != _userDataKey && key != _themeModeKey) {
        await prefs.remove(key);
      }
    }
  }
  
  Future<void> clearAll() async {
    // Clear all Shared Preferences data
    await prefs.clear();
    
    // Clear secure storage
    await secureStorage.deleteAll();
  }
  
  // Cache data with expiration
  Future<void> setCachedData(String key, dynamic data, {Duration? expiration}) async {
    final Map<String, dynamic> cacheData = {
      'data': data,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    
    if (expiration != null) {
      cacheData['expiration'] = expiration.inMilliseconds;
    }
    
    await prefs.setString(key, json.encode(cacheData));
  }
  
  Future<dynamic> getCachedData(String key) async {
    final cachedString = prefs.getString(key);
    if (cachedString == null) return null;
    
    try {
      final cacheData = json.decode(cachedString) as Map<String, dynamic>;
      final timestamp = cacheData['timestamp'] as int;
      final expirationMs = cacheData['expiration'] as int?;
      
      if (expirationMs != null) {
        final now = DateTime.now().millisecondsSinceEpoch;
        if (now - timestamp > expirationMs) {
          // Data has expired
          await prefs.remove(key);
          return null;
        }
      }
      
      return cacheData['data'];
    } catch (e) {
      await prefs.remove(key);
      return null;
    }
  }
  
  void dispose() {
    _themeModeController.close();
  }
}