class ImageModel {
  final String id;
  final String noteId;
  final String userId;
  final String storageUrl;
  final String fileName;
  final String contentType;
  final int size;
  final int? width;
  final int? height;
  final DateTime createdAt;

  ImageModel({
    required this.id,
    required this.noteId,
    required this.userId,
    required this.storageUrl,
    required this.fileName,
    required this.contentType,
    required this.size,
    this.width,
    this.height,
    required this.createdAt,
  });

  // Create from JSON
  factory ImageModel.fromJson(Map<String, dynamic> json) {
    return ImageModel(
      id: json['id'],
      noteId: json['noteId'],
      userId: json['userId'],
      storageUrl: json['storageUrl'],
      fileName: json['fileName'],
      contentType: json['contentType'],
      size: json['size'],
      width: json['width'],
      height: json['height'],
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt']),
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'noteId': noteId,
      'userId': userId,
      'storageUrl': storageUrl,
      'fileName': fileName,
      'contentType': contentType,
      'size': size,
      'width': width,
      'height': height,
      'createdAt': createdAt.millisecondsSinceEpoch,
    };
  }

  // Get the file extension
  String get fileExtension {
    final parts = fileName.split('.');
    return parts.length > 1 ? parts.last.toLowerCase() : '';
  }

  // Check if the image is a GIF
  bool get isGif => fileExtension == 'gif' || contentType == 'image/gif';

  // Check if the image is animated
  bool get isAnimated => isGif;

  // Get human-readable file size
  String get readableSize {
    if (size < 1024) {
      return '$size B';
    } else if (size < 1024 * 1024) {
      return '${(size / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }

  // Get aspect ratio if dimensions are available
  double? get aspectRatio {
    if (width != null && height != null && height! > 0) {
      return width! / height!;
    }
    return null;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
  
    return other is ImageModel &&
      other.id == id &&
      other.noteId == noteId &&
      other.userId == userId &&
      other.storageUrl == storageUrl;
  }

  @override
  int get hashCode {
    return id.hashCode ^
      noteId.hashCode ^
      userId.hashCode ^
      storageUrl.hashCode;
  }
}