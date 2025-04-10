// notetaker_frontend/lib/services/tier_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class TierService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Tier limits
  static const Map<String, Map<String, dynamic>> _tierLimits = {
    'free': {
      'maxModules': 2,
      'maxNotesPerModule': 10,
      'maxStorage': 52428800, // 50MB in bytes
      'features': ['basic_editor']
    },
    'pro': {
      'maxModules': 999999, // Virtually unlimited
      'maxNotesPerModule': 999999, // Virtually unlimited
      'maxStorage': 5368709120, // 5GB in bytes
      'features': [
        'basic_editor',
        'advanced_editor',
        'export',
        'offline_access',
        'collaboration'
      ]
    }
  };
  
  // Get user's current tier
  Future<String> getUserTier(String userId) async {
    try {
      final userDoc = await _firestore.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return 'free'; // Default to free tier
      }
      
      return userDoc.data()?['accountTier'] ?? 'free';
    } catch (e) {
      print('Error getting user tier: $e');
      return 'free'; // Default to free tier on error
    }
  }
  
  // Get tier limits
  Map<String, dynamic> getTierLimits(String tierName) {
    return _tierLimits[tierName] ?? _tierLimits['free']!;
  }
  
  // Check if user can create another module
  Future<bool> canCreateModule(String userId) async {
    try {
      final userDoc = await _firestore.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return false;
      }
      
      final userData = userDoc.data()!;
      final tierName = userData['accountTier'] ?? 'free';
      final moduleCount = userData['moduleCount'] ?? 0;
      
      final tierLimits = getTierLimits(tierName);
      final maxModules = tierLimits['maxModules'];
      
      return moduleCount < maxModules;
    } catch (e) {
      print('Error checking module limit: $e');
      return false;
    }
  }
  
  // Check if user can create another note in a module
  Future<bool> canCreateNote(String userId, String moduleId) async {
    try {
      final userDoc = await _firestore.collection('users').doc(userId).get();
      final moduleDoc = await _firestore.collection('modules').doc(moduleId).get();
      
      if (!userDoc.exists || !moduleDoc.exists) {
        return false;
      }
      
      final userData = userDoc.data()!;
      final moduleData = moduleDoc.data()!;
      
      final tierName = userData['accountTier'] ?? 'free';
      final noteCount = moduleData['noteCount'] ?? 0;
      
      final tierLimits = getTierLimits(tierName);
      final maxNotes = tierLimits['maxNotesPerModule'];
      
      return noteCount < maxNotes;
    } catch (e) {
      print('Error checking note limit: $e');
      return false;
    }
  }
  
  // Check if user can upload a file (storage limit)
  Future<bool> canUploadFile(String userId, int fileSize) async {
    try {
      final userDoc = await _firestore.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return false;
      }
      
      final userData = userDoc.data()!;
      final tierName = userData['accountTier'] ?? 'free';
      final storageUsed = userData['storageUsed'] ?? 0;
      
      final tierLimits = getTierLimits(tierName);
      final maxStorage = tierLimits['maxStorage'];
      
      return storageUsed + fileSize <= maxStorage;
    } catch (e) {
      print('Error checking storage limit: $e');
      return false;
    }
  }
  
  // Upgrade user's tier
  Future<bool> upgradeTier(String userId, String newTier) async {
    try {
      if (!_tierLimits.containsKey(newTier)) {
        return false;
      }
      
      await _firestore.collection('users').doc(userId).update({
        'accountTier': newTier,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      return true;
    } catch (e) {
      print('Error upgrading tier: $e');
      return false;
    }
  }
}