/// Represents a user in the application
class User {
  final String id;
  final String email;
  final String displayName;
  final String? photoUrl;
  final String accountTier;
  final int moduleCount;
  final int noteCount;
  final int storageUsed;
  final DateTime createdAt;
  final DateTime lastLoginAt;
  
  User({
    required this.id,
    required this.email,
    required this.displayName,
    this.photoUrl,
    required this.accountTier,
    this.moduleCount = 0,
    this.noteCount = 0,
    this.storageUsed = 0,
    required this.createdAt,
    required this.lastLoginAt,
  });
  
  /// Create a User from Firebase data
  factory User.fromFirebase(Map<String, dynamic> userData) {
    return User(
      id: userData['uid'] ?? '',
      email: userData['email'] ?? '',
      displayName: userData['displayName'] ?? '',
      photoUrl: userData['photoURL'],
      accountTier: userData['accountTier'] ?? 'free',
      moduleCount: userData['moduleCount'] ?? 0,
      noteCount: userData['noteCount'] ?? 0,
      storageUsed: userData['storageUsed'] ?? 0,
      createdAt: userData['createdAt']?.toDate() ?? DateTime.now(),
      lastLoginAt: userData['lastLoginAt']?.toDate() ?? DateTime.now(),
    );
  }
  
  /// Convert User to a Map for database storage
  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'displayName': displayName,
      'photoURL': photoUrl,
      'accountTier': accountTier,
      'moduleCount': moduleCount,
      'noteCount': noteCount,
      'storageUsed': storageUsed,
      'lastLoginAt': lastLoginAt,
    };
  }
  
  /// Copy with updated fields
  User copyWith({
    String? displayName,
    String? photoUrl,
    String? accountTier,
    int? moduleCount,
    int? noteCount,
    int? storageUsed,
    DateTime? lastLoginAt,
  }) {
    return User(
      id: id,
      email: email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      accountTier: accountTier ?? this.accountTier,
      moduleCount: moduleCount ?? this.moduleCount,
      noteCount: noteCount ?? this.noteCount,
      storageUsed: storageUsed ?? this.storageUsed,
      createdAt: createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
    );
  }
  
  /// Get the storage usage in readable format
  String get storageUsageFormatted {
    final kb = storageUsed / 1024;
    if (kb < 1024) {
      return '${kb.toStringAsFixed(1)} KB';
    } else {
      final mb = kb / 1024;
      if (mb < 1024) {
        return '${mb.toStringAsFixed(1)} MB';
      } else {
        final gb = mb / 1024;
        return '${gb.toStringAsFixed(1)} GB';
      }
    }
  }
  
  /// Get the storage limit based on account tier
  int get storageLimit {
    switch (accountTier) {
      case 'pro':
        return 5 * 1024 * 1024 * 1024; // 5GB in bytes
      case 'free':
      default:
        return 50 * 1024 * 1024; // 50MB in bytes
    }
  }
  
  /// Get the storage limit in readable format
  String get storageLimitFormatted {
    final bytes = storageLimit;
    final kb = bytes / 1024;
    if (kb < 1024) {
      return '${kb.toStringAsFixed(1)} KB';
    } else {
      final mb = kb / 1024;
      if (mb < 1024) {
        return '${mb.toStringAsFixed(1)} MB';
      } else {
        final gb = mb / 1024;
        return '${gb.toStringAsFixed(1)} GB';
      }
    }
  }
  
  /// Get the storage usage percentage
  double get storageUsagePercentage {
    return (storageUsed / storageLimit) * 100;
  }
  
  /// Get maximum allowed modules based on account tier
  int get moduleLimit {
    switch (accountTier) {
      case 'pro':
        return 999999; // Virtually unlimited
      case 'free':
      default:
        return 2;
    }
  }
  
  /// Get maximum allowed notes per module based on account tier
  int get noteLimit {
    switch (accountTier) {
      case 'pro':
        return 999999; // Virtually unlimited
      case 'free':
      default:
        return 10;
    }
  }
}