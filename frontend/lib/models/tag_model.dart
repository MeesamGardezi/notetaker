class TagModel {
  final String id;
  final String userId;
  final String name;
  final String? color;
  final int noteCount;
  final DateTime createdAt;

  TagModel({
    required this.id,
    required this.userId,
    required this.name,
    this.color,
    this.noteCount = 0,
    required this.createdAt,
  });

  // Create from JSON
  factory TagModel.fromJson(Map<String, dynamic> json) {
    return TagModel(
      id: json['id'],
      userId: json['userId'],
      name: json['name'],
      color: json['color'],
      noteCount: json['noteCount'] ?? 0,
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt']),
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'color': color,
      'noteCount': noteCount,
      'createdAt': createdAt.millisecondsSinceEpoch,
    };
  }

  // Copy with method for updating specific fields
  TagModel copyWith({
    String? name,
    String? color,
    int? noteCount,
  }) {
    return TagModel(
      id: this.id,
      userId: this.userId,
      name: name ?? this.name,
      color: color ?? this.color,
      noteCount: noteCount ?? this.noteCount,
      createdAt: this.createdAt,
    );
  }

  // Factory method for creating a new tag
  factory TagModel.empty({
    required String id,
    required String userId,
    required String name,
    String? color,
  }) {
    return TagModel(
      id: id,
      userId: userId,
      name: name,
      color: color,
      noteCount: 0,
      createdAt: DateTime.now(),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
  
    return other is TagModel &&
      other.id == id &&
      other.userId == userId &&
      other.name == name &&
      other.color == color;
  }

  @override
  int get hashCode {
    return id.hashCode ^
      userId.hashCode ^
      name.hashCode ^
      color.hashCode;
  }
}