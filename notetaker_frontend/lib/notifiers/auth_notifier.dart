import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase;
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthNotifier {
  final AuthService _authService;
  
  // Auth state
  final ValueNotifier<User?> _currentUser = ValueNotifier<User?>(null);
  final ValueNotifier<bool> _isLoading = ValueNotifier<bool>(false);
  final ValueNotifier<String?> _error = ValueNotifier<String?>(null);
  final ValueNotifier<bool> _isAuthenticated = ValueNotifier<bool>(false);
  
  // Expose notifiers as read-only
  ValueListenable<User?> get currentUser => _currentUser;
  ValueListenable<bool> get isLoading => _isLoading;
  ValueListenable<String?> get error => _error;
  ValueListenable<bool> get isAuthenticated => _isAuthenticated;
  
  AuthNotifier(this._authService) {
    // Initialize
    _init();
    
    // Listen to auth state changes
    _authService.authStateChanges.listen(_onAuthStateChanged);
  }
  
  Future<void> _init() async {
    _isLoading.value = true;
    
    try {
      final firebaseUser = _authService.currentUser;
      
      if (firebaseUser != null) {
        await _fetchUserData(firebaseUser.uid);
      }
    } catch (e) {
      _error.value = 'Failed to initialize authentication';
      print('Auth init error: $e');
    } finally {
      _isLoading.value = false;
    }
  }
  
  Future<void> _onAuthStateChanged(firebase.User? firebaseUser) async {
    if (firebaseUser == null) {
      _currentUser.value = null;
      _isAuthenticated.value = false;
    } else {
      await _fetchUserData(firebaseUser.uid);
    }
  }
  
  Future<void> _fetchUserData(String userId) async {
    try {
      final userData = await _authService.getUserData(userId);
      
      // Combine Firebase user with Firestore data
      userData['uid'] = userId;
      
      _currentUser.value = User.fromFirebase(userData);
      _isAuthenticated.value = true;
    } catch (e) {
      _error.value = 'Failed to load user data';
      print('Load user data error: $e');
    }
  }
  
  // Sign in
  Future<bool> signIn(String email, String password) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      final user = await _authService.signInWithEmailAndPassword(email, password);
      return user != null;
    } catch (e) {
      _handleAuthError(e);
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Register
  Future<bool> register(String email, String password, String displayName) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      final user = await _authService.createUserWithEmailAndPassword(
        email, 
        password, 
        displayName
      );
      return user != null;
    } catch (e) {
      _handleAuthError(e);
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Sign out
  Future<void> signOut() async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      await _authService.signOut();
      _currentUser.value = null;
      _isAuthenticated.value = false;
    } catch (e) {
      _error.value = 'Failed to sign out';
      print('Sign out error: $e');
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Reset password
  Future<bool> resetPassword(String email) async {
    _isLoading.value = true;
    _error.value = null;
    
    try {
      await _authService.resetPassword(email);
      return true;
    } catch (e) {
      _handleAuthError(e);
      return false;
    } finally {
      _isLoading.value = false;
    }
  }
  
  // Handle Firebase Auth errors
  void _handleAuthError(dynamic e) {
    if (e is firebase.FirebaseAuthException) {
      switch (e.code) {
        case 'user-not-found':
          _error.value = 'No user found with this email';
          break;
        case 'wrong-password':
          _error.value = 'Incorrect password';
          break;
        case 'email-already-in-use':
          _error.value = 'An account already exists with this email';
          break;
        case 'invalid-email':
          _error.value = 'Please enter a valid email address';
          break;
        case 'weak-password':
          _error.value = 'Password is too weak';
          break;
        default:
          _error.value = e.message ?? 'Authentication failed';
      }
    } else {
      _error.value = 'Authentication failed';
    }
    print('Auth error: $e');
  }
}