/// Represents a note within a module
class Note {
  final String id;
  final String title;
  final String content;
  final int position;
  final String moduleId;
  final String userId;
  final List<MediaItem> mediaFiles;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Note({
    required this.id,
    required this.title,
    this.content = '',
    required this.position,
    required this.moduleId,
    required this.userId,
    this.mediaFiles = const [],
    required this.createdAt,
    required this.updatedAt,
  });
  
  /// Create a Note from database data
  factory Note.fromMap(String id, Map<String, dynamic> data) {
    final List<dynamic> mediaData = data['mediaFiles'] ?? [];
    final List<MediaItem> media = mediaData
        .map((item) => MediaItem.fromMap(item))
        .toList();
    
    return Note(
      id: id,
      title: data['title'] ?? 'Untitled Note',
      content: data['content'] ?? '',
      position: data['position'] ?? 0,
      moduleId: data['moduleId'] ?? '',
      userId: data['userId'] ?? '',
      mediaFiles: media,
      createdAt: data['createdAt']?.toDate() ?? DateTime.now(),
      updatedAt: data['updatedAt']?.toDate() ?? DateTime.now(),
    );
  }
  
  /// Convert Note to a Map for database storage
  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'content': content,
      'position': position,
      'moduleId': moduleId,
      'userId': userId,
      'mediaFiles': mediaFiles.map((media) => media.toMap()).toList(),
      'updatedAt': updatedAt,
    };
  }
  
  /// Map for creating a new note
  Map<String, dynamic> toNewNoteMap() {
    final map = toMap();
    map['createdAt'] = DateTime.now();
    return map;
  }
  
  /// Copy with updated fields
  Note copyWith({
    String? title,
    String? content,
    int? position,
    List<MediaItem>? mediaFiles,
    DateTime? updatedAt,
  }) {
    return Note(
      id: id,
      title: title ?? this.title,
      content: content ?? this.content,
      position: position ?? this.position,
      moduleId: moduleId,
      userId: userId,
      mediaFiles: mediaFiles ?? this.mediaFiles,
      createdAt: createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }
  
  /// Get a content preview (for note cards)
  String get contentPreview {
    // Strip HTML tags if present
    final strippedContent = content.replaceAll(RegExp(r'<[^>]*>'), '');
    
    if (strippedContent.length <= 100) {
      return strippedContent;
    }
    return '${strippedContent.substring(0, 97)}...';
  }
}

/// Represents a media file attached to a note
class MediaItem {
  final String id;
  final String filename;
  final String originalFilename;
  final String storagePath;
  final String mimeType;
  final int size;
  final String url;
  final DateTime createdAt;
  
  MediaItem({
    required this.id,
    required this.filename,
    required this.originalFilename,
    required this.storagePath,
    required this.mimeType,
    required this.size,
    required this.url,
    required this.createdAt,
  });
  
  /// Create a MediaItem from Map data
  factory MediaItem.fromMap(Map<String, dynamic> data) {
    return MediaItem(
      id: data['id'] ?? '',
      filename: data['filename'] ?? '',
      originalFilename: data['originalFilename'] ?? '',
      storagePath: data['storagePath'] ?? '',
      mimeType: data['mimeType'] ?? '',
      size: data['size'] ?? 0,
      url: data['url'] ?? '',
      createdAt: data['createdAt']?.toDate() ?? DateTime.now(),
    );
  }
  
  /// Convert MediaItem to a Map
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'filename': filename,
      'originalFilename': originalFilename,
      'storagePath': storagePath,
      'mimeType': mimeType,
      'size': size,
      'url': url,
      'createdAt': createdAt,
    };
  }
  
  /// Get formatted file size
  String get formattedSize {
    if (size < 1024) {
      return '$size B';
    } else if (size < 1024 * 1024) {
      return '${(size / 1024).toStringAsFixed(1)} KB';
    } else if (size < 1024 * 1024 * 1024) {
      return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(size / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }
  
  /// Check if media is an image
  bool get isImage => mimeType.startsWith('image/');
  
  /// Check if media is a document
  bool get isDocument => 
      mimeType.contains('pdf') || 
      mimeType.contains('word') || 
      mimeType.contains('text') ||
      mimeType.contains('document');
}