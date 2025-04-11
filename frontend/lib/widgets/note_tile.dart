import 'package:flutter/material.dart';
import '../models/note_model.dart';
import '../models/tag_model.dart';
import '../utils/formatters.dart';
import 'tag_chip.dart';

class NoteTile extends StatelessWidget {
  final NoteModel note;
  final List<TagModel>? tags;
  final VoidCallback? onTap;
  final VoidCallback? onStarTap;
  final VoidCallback? onDeleteTap;
  final VoidCallback? onArchiveTap;
  
  const NoteTile({
    Key? key,
    required this.note,
    this.tags,
    this.onTap,
    this.onStarTap,
    this.onDeleteTap,
    this.onArchiveTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Get the tags that belong to this note
    final noteTags = tags?.where((tag) => note.tags.contains(tag.id)).toList() ?? [];
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title and star button
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Expanded(
                    child: Text(
                      note.title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  
                  // Star button
                  if (onStarTap != null)
                    IconButton(
                      icon: Icon(
                        note.isStarred ? Icons.star : Icons.star_border,
                        color: note.isStarred ? Colors.amber : null,
                      ),
                      onPressed: onStarTap,
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
              
              // Preview text
              if (note.plainText.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  Formatters.formatTextPreview(note.plainText),
                  style: theme.textTheme.bodyMedium,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              
              // Tags
              if (noteTags.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: noteTags.map((tag) => TagChip(tag: tag)).toList(),
                ),
              ],
              
              // Updated date and actions
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Updated date
                  Text(
                    Formatters.formatRelativeTime(note.updatedAt),
                    style: theme.textTheme.bodySmall,
                  ),
                  
                  // Actions
                  Row(
                    children: [
                      if (onArchiveTap != null)
                        IconButton(
                          icon: Icon(
                            note.isArchived ? Icons.unarchive : Icons.archive,
                            size: 20,
                          ),
                          onPressed: onArchiveTap,
                          tooltip: note.isArchived ? 'Unarchive' : 'Archive',
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                          visualDensity: VisualDensity.compact,
                        ),
                      if (onDeleteTap != null) ...[
                        const SizedBox(width: 12),
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline,
                            size: 20,
                          ),
                          onPressed: onDeleteTap,
                          tooltip: 'Delete',
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}