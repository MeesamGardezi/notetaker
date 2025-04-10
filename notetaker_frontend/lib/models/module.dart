import 'package:flutter/material.dart';

/// Represents a module (collection of notes)
class Module {
  final String id;
  final String name;
  final String description;
  final Color color;
  final int position;
  final String userId;
  final int noteCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Module({
    required this.id,
    required this.name,
    this.description = '',
    required this.color,
    required this.position,
    required this.userId,
    this.noteCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });
  
  /// Create a Module from database data
  factory Module.fromMap(String id, Map<String, dynamic> data) {
    // Convert hex color string to Color
    final String colorHex = data['color'] ?? '#557B83';
    final int colorValue = int.parse(colorHex.substring(1), radix: 16) + 0xFF000000;
    
    return Module(
      id: id,
      name: data['name'] ?? 'Untitled Module',
      description: data['description'] ?? '',
      color: Color(colorValue),
      position: data['position'] ?? 0,
      userId: data['userId'] ?? '',
      noteCount: data['noteCount'] ?? 0,
      createdAt: data['createdAt']?.toDate() ?? DateTime.now(),
      updatedAt: data['updatedAt']?.toDate() ?? DateTime.now(),
    );
  }
  
  /// Convert Module to a Map for database storage
  Map<String, dynamic> toMap() {
    // Convert Color to hex string
    final String colorHex = '#${color.value.toRadixString(16).substring(2)}';
    
    return {
      'name': name,
      'description': description,
      'color': colorHex,
      'position': position,
      'userId': userId,
      'noteCount': noteCount,
      'updatedAt': updatedAt,
    };
  }
  
  /// Map for creating a new module
  Map<String, dynamic> toNewModuleMap() {
    final map = toMap();
    map['createdAt'] = DateTime.now();
    return map;
  }
  
  /// Copy with updated fields
  Module copyWith({
    String? name,
    String? description,
    Color? color,
    int? position,
    int? noteCount,
    DateTime? updatedAt,
  }) {
    return Module(
      id: id,
      name: name ?? this.name,
      description: description ?? this.description,
      color: color ?? this.color,
      position: position ?? this.position,
      userId: userId,
      noteCount: noteCount ?? this.noteCount,
      createdAt: createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }
}