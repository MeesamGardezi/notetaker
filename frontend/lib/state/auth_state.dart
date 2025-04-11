import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../models/user_model.dart';

class AuthState extends ChangeNotifier {
  final ApiService apiService;
  final StorageService storageService;
  
  bool _isInitialized = false;
  bool _isLoggedIn = false;
  String? _token;
  UserModel? _user;
  
  // Public getters
  bool get isInitialized => _isInitialized;
  bool get isLoggedIn => _isLoggedIn;
  String? get token => _token;
  UserModel? get user => _user;
  
  AuthState({
    required this.apiService,
    required this.storageService,
  });

  
  
  // Initialize authentication state from storage
  Future<void> initializeAuth() async {
    try {
      _token = await storageService.getAuthToken();
      if (_token != null && _token!.isNotEmpty) {
        // Token exists, attempt to load user
        final userData = await storageService.getUserData();
        if (userData != null) {
          _user = UserModel.fromJson(userData);
          _isLoggedIn = true;
        } else {
          // User data missing, attempt to fetch from API
          await refreshUserProfile();
        }
      }
    } catch (e) {
      // Handle error
      await logout();
    } finally {
      _isInitialized = true;
      notifyListeners();
    }
  }

  
  
  // Login user with email and password
  Future<bool> login(String email, String password) async {
    try {
      final response = await apiService.login(email, password);
      _token = response['token'];
      _user = UserModel.fromJson(response['user']);
      
      // Save auth data to storage
      await storageService.setAuthToken(_token!);
      await storageService.setUserData(_user!.toJson());
      
      _isLoggedIn = true;
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Register a new user
  Future<bool> register(String email, String password, String displayName) async {
    try {
      final response = await apiService.register(email, password, displayName);
      _token = response['token'];
      _user = UserModel.fromJson(response['user']);
      
      // Save auth data to storage
      await storageService.setAuthToken(_token!);
      await storageService.setUserData(_user!.toJson());
      
      _isLoggedIn = true;
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Logout user
  Future<void> logout() async {
    try {
      if (_token != null) {
        await apiService.logout();
      }
    } catch (e) {
      // Ignore API errors during logout
    } finally {
      // Clear local storage and state
      await storageService.clearAuthToken();
      await storageService.clearUserData();
      
      _token = null;
      _user = null;
      _isLoggedIn = false;
      notifyListeners();
    }
  }
  
  // Refresh the token
  Future<bool> refreshToken() async {
    if (_token == null) return false;
    
    try {
      final response = await apiService.refreshToken();
      _token = response['token'];
      await storageService.setAuthToken(_token!);
      notifyListeners();
      return true;
    } catch (e) {
      // If token refresh fails, log user out
      await logout();
      return false;
    }
  }
  
  // Refresh user profile data
  Future<bool> refreshUserProfile() async {
    if (_token == null) return false;
    
    try {
      final userData = await apiService.getUserProfile();
      _user = UserModel.fromJson(userData);
      await storageService.setUserData(_user!.toJson());
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Update user profile
  Future<bool> updateProfile({String? displayName, Map<String, dynamic>? settings}) async {
    if (_token == null || _user == null) return false;
    
    try {
      final updateData = <String, dynamic>{};
      if (displayName != null) updateData['displayName'] = displayName;
      if (settings != null) updateData['settings'] = settings;
      
      final userData = await apiService.updateUserProfile(updateData);
      _user = UserModel.fromJson(userData['user']);
      await storageService.setUserData(_user!.toJson());
      notifyListeners();
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Change user password
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    if (_token == null) return false;
    
    try {
      await apiService.changePassword(currentPassword, newPassword);
      return true;
    } catch (e) {
      return false;
    }
  }
}