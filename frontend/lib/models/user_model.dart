class UserModel {
  final String id;
  final String email;
  final String displayName;
  final String? photoUrl;
  final String tier;
  final Map<String, dynamic> settings;
  final DateTime createdAt;
  final DateTime lastLoginAt;

  UserModel({
    required this.id,
    required this.email,
    required this.displayName,
    this.photoUrl,
    required this.tier,
    required this.settings,
    required this.createdAt,
    required this.lastLoginAt,
  });

  // Create from JSON
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      displayName: json['displayName'],
      photoUrl: json['photoUrl'],
      tier: json['tier'],
      settings: json['settings'] ?? {},
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt']),
      lastLoginAt: DateTime.fromMillisecondsSinceEpoch(json['lastLoginAt']),
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'tier': tier,
      'settings': settings,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'lastLoginAt': lastLoginAt.millisecondsSinceEpoch,
    };
  }

  // Copy with method for updating specific fields
  UserModel copyWith({
    String? displayName,
    String? photoUrl,
    String? tier,
    Map<String, dynamic>? settings,
    DateTime? lastLoginAt,
  }) {
    return UserModel(
      id: this.id,
      email: this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      tier: tier ?? this.tier,
      settings: settings ?? this.settings,
      createdAt: this.createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
    );
  }
  
  // Helper to get theme preference
  String getThemePreference() {
    return settings['theme'] as String? ?? 'system';
  }
  
  // Helper to get font size preference
  double getFontSizePreference() {
    return (settings['fontSizePreference'] as num?)?.toDouble() ?? 16.0;
  }
  
  // Check tier limits
  bool get isPremium => tier == 'premium';
  
  int get maxModules => isPremium ? 999 : 2;
  int get maxNotesPerModule => isPremium ? 999 : 10;
  int get maxTags => isPremium ? 999 : 20;
  int get maxImageSizeBytes => isPremium ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
}