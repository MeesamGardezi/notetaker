import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Formatters {
  /// Format a DateTime to a readable date string
  static String formatDate(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays == 0) {
      // Today - show time
      return 'Today, ${DateFormat.jm().format(dateTime)}';
    } else if (difference.inDays == 1) {
      // Yesterday
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      // Within a week
      return DateFormat.EEEE().format(dateTime); // Day name
    } else if (dateTime.year == now.year) {
      // This year
      return DateFormat.MMMd().format(dateTime); // Month and day
    } else {
      // Different year
      return DateFormat.yMMMd().format(dateTime); // Year, month and day
    }
  }
  
  /// Format a DateTime to a readable date and time string
  static String formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays == 0) {
      // Today - show time
      return 'Today, ${DateFormat.jm().format(dateTime)}';
    } else if (difference.inDays == 1) {
      // Yesterday
      return 'Yesterday, ${DateFormat.jm().format(dateTime)}';
    } else if (difference.inDays < 7) {
      // Within a week
      return '${DateFormat.EEEE().format(dateTime)}, ${DateFormat.jm().format(dateTime)}';
    } else if (dateTime.year == now.year) {
      // This year
      return DateFormat('MMM d, h:mm a').format(dateTime);
    } else {
      // Different year
      return DateFormat('MMM d, y, h:mm a').format(dateTime);
    }
  }
  
  /// Format a DateTime to a relative time string (e.g. "2 hours ago")
  static String formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inSeconds < 60) {
      return difference.inSeconds == 0
          ? 'just now'
          : '${difference.inSeconds} second${difference.inSeconds != 1 ? 's' : ''} ago';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} minute${difference.inMinutes != 1 ? 's' : ''} ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hour${difference.inHours != 1 ? 's' : ''} ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} day${difference.inDays != 1 ? 's' : ''} ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks week${weeks != 1 ? 's' : ''} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months month${months != 1 ? 's' : ''} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years year${years != 1 ? 's' : ''} ago';
    }
  }
  
  /// Format a file size in bytes to a readable string
  static String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }
  
  /// Get IconData from icon name string
  static IconData getIconData(String iconName) {
    switch (iconName) {
      case 'book':
        return Icons.book;
      case 'note':
        return Icons.note;
      case 'folder':
        return Icons.folder;
      case 'star':
        return Icons.star;
      case 'favorite':
        return Icons.favorite;
      case 'work':
        return Icons.work;
      case 'school':
        return Icons.school;
      case 'home':
        return Icons.home;
      case 'business':
        return Icons.business;
      case 'code':
        return Icons.code;
      case 'science':
        return Icons.science;
      case 'history':
        return Icons.history;
      case 'language':
        return Icons.language;
      case 'art':
        return Icons.art_track;
      case 'music':
        return Icons.music_note;
      default:
        return Icons.folder;
    }
  }
  
  /// Format a plain text with preview and truncate if needed
  static String formatTextPreview(String text, {int maxLength = 100}) {
    if (text.isEmpty) {
      return '';
    }
    
    // Remove excessive whitespace
    final cleanText = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    
    if (cleanText.length <= maxLength) {
      return cleanText;
    }
    
    return '${cleanText.substring(0, maxLength)}...';
  }
  
  /// Format a title for note/module
  static String formatTitle(String title, {bool required = true}) {
    if (title.isEmpty) {
      return required ? 'Untitled' : '';
    }
    
    return title.trim();
  }
}