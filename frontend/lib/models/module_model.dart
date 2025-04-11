class ModuleModel {
  final String id;
  final String userId;
  final String title;
  final String? description;
  final String? color;
  final String? icon;
  final int sortOrder;
  final bool isArchived;
  final int noteCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  ModuleModel({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.color,
    this.icon,
    required this.sortOrder,
    this.isArchived = false,
    this.noteCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  // Create from JSON
  factory ModuleModel.fromJson(Map<String, dynamic> json) {
    return ModuleModel(
      id: json['id'],
      userId: json['userId'],
      title: json['title'],
      description: json['description'],
      color: json['color'],
      icon: json['icon'],
      sortOrder: json['sortOrder'],
      isArchived: json['isArchived'] ?? false,
      noteCount: json['noteCount'] ?? 0,
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt']),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(json['updatedAt']),
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'description': description,
      'color': color,
      'icon': icon,
      'sortOrder': sortOrder,
      'isArchived': isArchived,
      'noteCount': noteCount,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'updatedAt': updatedAt.millisecondsSinceEpoch,
    };
  }

  // Copy with method for updating specific fields
  ModuleModel copyWith({
    String? title,
    String? description,
    String? color,
    String? icon,
    int? sortOrder,
    bool? isArchived,
    int? noteCount,
    DateTime? updatedAt,
  }) {
    return ModuleModel(
      id: this.id,
      userId: this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      color: color ?? this.color,
      icon: icon ?? this.icon,
      sortOrder: sortOrder ?? this.sortOrder,
      isArchived: isArchived ?? this.isArchived,
      noteCount: noteCount ?? this.noteCount,
      createdAt: this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Factory method for creating a new empty module
  factory ModuleModel.empty({
    required String id,
    required String userId,
    String title = 'New Module',
  }) {
    final now = DateTime.now();
    return ModuleModel(
      id: id,
      userId: userId,
      title: title,
      description: null,
      color: null,
      icon: null,
      sortOrder: now.millisecondsSinceEpoch,
      isArchived: false,
      noteCount: 0,
      createdAt: now,
      updatedAt: now,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
  
    return other is ModuleModel &&
      other.id == id &&
      other.userId == userId &&
      other.title == title &&
      other.description == description &&
      other.color == color &&
      other.icon == icon &&
      other.sortOrder == sortOrder &&
      other.isArchived == isArchived &&
      other.noteCount == noteCount;
  }

  @override
  int get hashCode {
    return id.hashCode ^
      userId.hashCode ^
      title.hashCode ^
      description.hashCode ^
      color.hashCode ^
      icon.hashCode ^
      sortOrder.hashCode ^
      isArchived.hashCode ^
      noteCount.hashCode;
  }
}