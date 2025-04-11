class NoteModel {
  final String id;
  final String moduleId;
  final String userId;
  final String title;
  final Map<String, dynamic> content;
  final List<String> tags;
  final bool isStarred;
  final bool isArchived;
  final int sortOrder;
  final String lastEditedBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  NoteModel({
    required this.id,
    required this.moduleId,
    required this.userId,
    required this.title,
    required this.content,
    this.tags = const [],
    this.isStarred = false,
    this.isArchived = false,
    required this.sortOrder,
    required this.lastEditedBy,
    required this.createdAt,
    required this.updatedAt,
  });

  // Create from JSON
  factory NoteModel.fromJson(Map<String, dynamic> json) {
    return NoteModel(
      id: json['id'],
      moduleId: json['moduleId'],
      userId: json['userId'],
      title: json['title'],
      content: json['content'] ?? {'blocks': [], 'version': '1.0', 'plainText': ''},
      tags: List<String>.from(json['tags'] ?? []),
      isStarred: json['isStarred'] ?? false,
      isArchived: json['isArchived'] ?? false,
      sortOrder: json['sortOrder'],
      lastEditedBy: json['lastEditedBy'],
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt']),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(json['updatedAt']),
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'moduleId': moduleId,
      'userId': userId,
      'title': title,
      'content': content,
      'tags': tags,
      'isStarred': isStarred,
      'isArchived': isArchived,
      'sortOrder': sortOrder,
      'lastEditedBy': lastEditedBy,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'updatedAt': updatedAt.millisecondsSinceEpoch,
    };
  }

  // Copy with method for updating specific fields
  NoteModel copyWith({
    String? moduleId,
    String? title,
    Map<String, dynamic>? content,
    List<String>? tags,
    bool? isStarred,
    bool? isArchived,
    int? sortOrder,
    String? lastEditedBy,
    DateTime? updatedAt,
  }) {
    return NoteModel(
      id: this.id,
      moduleId: moduleId ?? this.moduleId,
      userId: this.userId,
      title: title ?? this.title,
      content: content ?? this.content,
      tags: tags ?? this.tags,
      isStarred: isStarred ?? this.isStarred,
      isArchived: isArchived ?? this.isArchived,
      sortOrder: sortOrder ?? this.sortOrder,
      lastEditedBy: lastEditedBy ?? this.lastEditedBy,
      createdAt: this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Factory method for creating a new empty note
  factory NoteModel.empty({
    required String id,
    required String moduleId,
    required String userId,
    String title = 'New Note',
  }) {
    final now = DateTime.now();
    return NoteModel(
      id: id,
      moduleId: moduleId,
      userId: userId,
      title: title,
      content: {
        'blocks': [],
        'version': '1.0',
        'plainText': '',
      },
      tags: [],
      isStarred: false,
      isArchived: false,
      sortOrder: now.millisecondsSinceEpoch,
      lastEditedBy: userId,
      createdAt: now,
      updatedAt: now,
    );
  }

  // Helper methods for note content
  String get plainText => content['plainText'] ?? '';
  
  List<dynamic> get blocks => content['blocks'] ?? [];
  
  bool get isEmpty => blocks.isEmpty || plainText.isEmpty;
  
  String get preview {
    if (plainText.isEmpty) return '';
    return plainText.length > 100 ? '${plainText.substring(0, 100)}...' : plainText;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
  
    return other is NoteModel &&
      other.id == id &&
      other.moduleId == moduleId &&
      other.userId == userId &&
      other.title == title &&
      other.isStarred == isStarred &&
      other.isArchived == isArchived &&
      other.sortOrder == sortOrder;
  }

  @override
  int get hashCode {
    return id.hashCode ^
      moduleId.hashCode ^
      userId.hashCode ^
      title.hashCode ^
      isStarred.hashCode ^
      isArchived.hashCode ^
      sortOrder.hashCode;
  }
}