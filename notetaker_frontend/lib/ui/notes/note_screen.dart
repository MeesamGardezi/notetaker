// notetaker_frontend/lib/ui/notes/note_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../models/module.dart';
import '../../models/note.dart';
import '../../notifiers/module_notifier.dart';
import '../../notifiers/note_notifier.dart';
import '../shared/styles.dart';
import '../shared/widgets/loading_indicator.dart';

class NoteScreen extends StatefulWidget {
  final String moduleId;
  final String noteId;
  final ModuleNotifier moduleNotifier;
  final NoteNotifier noteNotifier;
  
  const NoteScreen({
    Key? key,
    required this.moduleId,
    required this.noteId,
    required this.moduleNotifier,
    required this.noteNotifier,
  }) : super(key: key);

  @override
  State<NoteScreen> createState() => _NoteScreenState();
}

class _NoteScreenState extends State<NoteScreen> {
  late quill.QuillController _quillController;
  bool _isLoading = true;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _quillController = quill.QuillController.basic();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      // Load module if not already loaded
      await widget.moduleNotifier.selectModuleById(widget.moduleId);
      
      // Load note
      final success = await widget.noteNotifier.selectNoteById(widget.noteId);
      
      if (success) {
        final note = widget.noteNotifier.selectedNote.value;
        
        if (note != null && note.content.isNotEmpty) {
          try {
            // Try to parse as Quill JSON
            final contentJson = note.content;
            _quillController = quill.QuillController(
              document: quill.Document.fromJson(contentJson),
              selection: const TextSelection.collapsed(offset: 0),
            );
          } catch (e) {
            // If not valid Quill JSON, use as plain text
            _quillController = quill.QuillController(
              document: quill.Document.fromPlainText(note.content),
              selection: const TextSelection.collapsed(offset: 0),
            );
          }
        }
      }
    } catch (e) {
      _error = 'Failed to load note: $e';
      print(_error);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  Future<void> _deleteNote() async {
    final note = widget.noteNotifier.selectedNote.value;
    if (note == null) return;
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text(AppStrings.deleteNote),
          content: Text(
            'Are you sure you want to delete "${note.title}"? This action cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text(AppStrings.cancel),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              style: TextButton.styleFrom(foregroundColor: AppTheme.error),
              child: const Text(AppStrings.delete),
            ),
          ],
        );
      },
    );
    
    if (confirm == true) {
      setState(() {
        _isLoading = true;
      });
      
      try {
        final success = await widget.noteNotifier.deleteNote(note);
        
        if (success && mounted) {
          context.go('${AppRoutes.modules}/${widget.moduleId}');
        }
      } catch (e) {
        setState(() {
          _error = 'Failed to delete note: $e';
          _isLoading = false;
        });
        print(_error);
      }
    }
  }
  
  @override
  void dispose() {
    _quillController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Module?>(
      valueListenable: widget.moduleNotifier.selectedModule,
      builder: (context, module, _) {
        return ValueListenableBuilder<Note?>(
          valueListenable: widget.noteNotifier.selectedNote,
          builder: (context, note, _) {
            final Color accentColor = module?.color ?? AppTheme.primaryColor;
            
            // Build AppBar
            final appBar = AppBar(
              title: note != null ? Text(note.title) : const Text('Note'),
              backgroundColor: accentColor.withOpacity(0.1),
              foregroundColor: accentColor,
              actions: [
                if (note != null) ...[
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () => context.push('${AppRoutes.modules}/${widget.moduleId}/notes/${widget.noteId}/edit'),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: _deleteNote,
                  ),
                ],
              ],
            );
            
            if (_isLoading) {
              return Scaffold(
                appBar: appBar,
                body: const Center(child: LoadingIndicator()),
              );
            }
            
            if (note == null) {
              return Scaffold(
                appBar: appBar,
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.note_outlined,
                        size: 64,
                        color: AppTheme.textHint,
                      ),
                      const SizedBox(height: AppTheme.spacingM),
                      Text(
                        _error ?? 'Note not found',
                        style: TextStyles.body,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }
            
            return Scaffold(
              appBar: appBar,
              body: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: Paddings.page,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Read-only note content
                          quill.QuillEditor.basic(
                            controller: _quillController,
                            readOnly: true,
                          ),
                          
                          // Attachments section if note has media files
                          if (note.mediaFiles.isNotEmpty) ...[
                            const SizedBox(height: AppTheme.spacingL),
                            const Divider(),
                            const SizedBox(height: AppTheme.spacingM),
                            Text(
                              AppStrings.attachments,
                              style: TextStyles.heading3,
                            ),
                            const SizedBox(height: AppTheme.spacingM),
                            _buildAttachmentsList(note),
                          ],
                        ],
                      ),
                    ),
                  ),
                  // Note metadata footer
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacingM),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: AppTheme.surfaceColor)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Last edited ${_formatDate(note.updatedAt)}',
                                style: TextStyles.caption,
                              ),
                              Text(
                                'Created ${_formatDate(note.createdAt)}',
                                style: TextStyles.caption,
                              ),
                            ],
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => context.push('${AppRoutes.modules}/${widget.moduleId}/notes/${widget.noteId}/edit'),
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text(AppStrings.edit),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: accentColor,
                            side: BorderSide(color: accentColor),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
  
  Widget _buildAttachmentsList(Note note) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: note.mediaFiles.length,
      itemBuilder: (context, index) {
        final media = note.mediaFiles[index];
        final isImage = media.isImage;
        
        return Card(
          margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
          child: ListTile(
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(AppTheme.radiusS),
              ),
              child: Center(
                child: Icon(
                  isImage ? Icons.image : Icons.insert_drive_file,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            title: Text(
              media.originalFilename,
              style: TextStyles.bodyLarge,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Text(
              media.formattedSize,
              style: TextStyles.caption,
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.download, size: 20),
                  onPressed: () {
                    // Open in browser
                    launchUrl(Uri.parse(media.url));
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 20),
                  onPressed: () => _deleteAttachment(media),
                ),
              ],
            ),
            onTap: () {
              // Open in browser
              launchUrl(Uri.parse(media.url));
            },
          ),
        );
      },
    );
  }
  
  Future<void> _deleteAttachment(MediaItem media) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Attachment'),
          content: Text(
            'Are you sure you want to delete "${media.originalFilename}"? This action cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text(AppStrings.cancel),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              style: TextButton.styleFrom(foregroundColor: AppTheme.error),
              child: const Text(AppStrings.delete),
            ),
          ],
        );
      },
    );
    
    if (confirm == true) {
      setState(() {
        _isLoading = true;
      });
      
      try {
        final note = widget.noteNotifier.selectedNote.value;
        if (note != null) {
          await widget.noteNotifier.deleteMedia(media, note.userId, note.id);
        }
      } catch (e) {
        setState(() {
          _error = 'Failed to delete attachment: $e';
        });
        print(_error);
      } finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        if (difference.inMinutes == 0) {
          return 'just now';
        }
        return '${difference.inMinutes} min ago';
      }
      return '${difference.inHours} hours ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
  
  Future<void> launchUrl(Uri url) async {
    // This is a stub - in a real app, you'd use url_launcher package
    // But we'll leave it as is for now
    print('Opening URL: $url');
  }
}