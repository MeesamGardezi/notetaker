import 'package:flutter/material.dart';
import '../models/tag_model.dart';

class TagChip extends StatelessWidget {
  final TagModel tag;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;
  final bool showDelete;
  
  const TagChip({
    Key? key,
    required this.tag,
    this.onTap,
    this.onDelete,
    this.showDelete = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Parse tag color if available
    Color? tagColor;
    if (tag.color != null && tag.color!.startsWith('#')) {
      tagColor = Color(int.parse(tag.color!.substring(1, 7), radix: 16) + 0xFF000000);
    }
    
    // Use tag color or default to theme color
    final chipColor = tagColor ?? theme.colorScheme.secondary;
    
    // Create chip
    return Chip(
      label: Text(
        tag.name,
        style: TextStyle(
          fontSize: 12,
          color: _contrastColor(chipColor),
        ),
      ),
      backgroundColor: chipColor.withOpacity(0.8),
      onDeleted: showDelete ? onDelete : null,
      deleteIconColor: _contrastColor(chipColor),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      visualDensity: VisualDensity.compact,
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }
  
  // Calculate contrast color for text (black or white)
  Color _contrastColor(Color backgroundColor) {
    // Calculate luminance (brightness) of the background color
    final luminance = (0.299 * backgroundColor.red + 
                       0.587 * backgroundColor.green + 
                       0.114 * backgroundColor.blue) / 255;
    
    // Use white text on dark backgrounds, black text on light backgrounds
    return luminance > 0.5 ? Colors.black : Colors.white;
  }
}