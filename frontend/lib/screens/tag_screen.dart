import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/tag_model.dart';
import '../models/note_model.dart';
import '../state/auth_state.dart';
import '../state/tags_state.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/note_tile.dart';

class TagScreen extends StatefulWidget {
  final String tagId;
  
  const TagScreen({Key? key, required this.tagId}) : super(key: key);

  @override
  State<TagScreen> createState() => _TagScreenState();
}

class _TagScreenState extends State<TagScreen> {
  late TagsState _tagsState;
  
  bool _isLoading = true;
  String? _errorMessage;
  bool _showArchived = false;
  
  @override
  void initState() {
    super.initState();
    
    // Initialize state
    _initializeState();
  }
  
  void _initializeState() async {
    // Get auth state
    final authState = AuthState.of(context);
    
    // Create state
    _tagsState = TagsState(
      apiService: authState.apiService,
      storageService: authState.storageService,
    );
    
    // Load data
    setState(() => _isLoading = true);
    
    try {
      // Load tag notes
      await _tagsState.loadTagNotes(widget.tagId);
      
      setState(() {
        _isLoading = false;
        _errorMessage = null;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load data: ${e.toString()}';
      });
    }
  }
  
  void _toggleArchived() async {
    setState(() => _showArchived = !_showArchived);
    
    _tagsState.includeArchived.value = _showArchived;
    await _tagsState.loadTagNotes(widget.tagId);
  }
  
  void _showEditTagDialog() {
    final tag = _tagsState.selectedTag.value;
    if (tag == null) return;
    
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: tag.name);
    String? selectedColor = tag.color;
    
    // Available colors
    final colors = [
      '#3F51B5', // Blue
      '#303F9F', // Indigo
      '#9C27B0', // Purple
      '#E91E63', // Pink
      '#F44336', // Red
      '#FF9800', // Orange
      '#FFC107', // Yellow
      '#4CAF50', // Green
      '#009688', // Teal
      '#00BCD4', // Cyan
    ];
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Edit Tag'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Tag Name',
                    hintText: 'Enter tag name',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a tag name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                const Text('Color:'),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: colors.map((color) {
                    final isSelected = color == selectedColor;
                    
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          selectedColor = color;
                        });
                      },
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: color != null
                              ? Color(int.parse(color.substring(1, 7), radix: 16) + 0xFF000000)
                              : Colors.grey,
                          shape: BoxShape.circle,
                          border: isSelected
                              ? Border.all(
                                  color: Colors.white,
                                  width: 2,
                                )
                              : null,
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.3),
                                    blurRadius: 4,
                                    spreadRadius: 1,
                                  ),
                                ]
                              : null,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  final name = nameController.text.trim();
                  
                  Navigator.pop(context);
                  
                  _updateTag(name, selectedColor);
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _updateTag(String name, String? color) async {
    final tag = _tagsState.selectedTag.value;
    if (tag == null) return;
    
    setState(() => _isLoading = true);
    
    try {
      await _tagsState.updateTag(
        tag.id,
        name: name,
        color: color,
      );
      
      // Reload tag
      await _tagsState.loadTagNotes(widget.tagId);
      
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to update tag: ${e.toString()}';
      });
    }
  }
  
  void _showDeleteTagDialog() {
    final tag = _tagsState.selectedTag.value;
    if (tag == null) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Tag'),
        content: Text(
          'Are you sure you want to delete the tag "${tag.name}"?\n\n'
          'This will remove the tag from all notes, but will not delete the notes themselves.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Theme.of(context).colorScheme.onError,
            ),
            onPressed: () {
              Navigator.pop(context);
              _deleteTag();
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _deleteTag() async {
    final tag = _tagsState.selectedTag.value;
    if (tag == null) return;
    
    setState(() => _isLoading = true);
    
    try {
      final success = await _tagsState.deleteTag(tag.id);
      
      if (success && mounted) {
        context.pop();
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Failed to delete tag';
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to delete tag: ${e.toString()}';
      });
    }
  }
  
  @override
  void dispose() {
    _tagsState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: CustomAppBar(
        title: 'Tag',
        showBackButton: true,
        actions: [
          // Archive toggle
          IconButton(
            icon: Icon(_showArchived ? Icons.visibility_off : Icons.visibility),
            onPressed: _toggleArchived,
            tooltip: _showArchived ? 'Hide Archived' : 'Show Archived',
          ),
          
          // More options
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'edit':
                  _showEditTagDialog();
                  break;
                case 'delete':
                  _showDeleteTagDialog();
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    const Text('Edit Tag'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: theme.colorScheme.error),
                    const SizedBox(width: 8),
                    const Text('Delete Tag'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _errorMessage != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: theme.colorScheme.error,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error',
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _initializeState,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _buildBody(),
    );
  }
  
  Widget _buildBody() {
    return Column(
      children: [
        // Tag header
        ValueListenableBuilder<TagModel?>(
          valueListenable: _tagsState.selectedTag,
          builder: (context, tag, child) {
            if (tag == null) {
              return const SizedBox.shrink();
            }
            
            // Parse tag color if available
            Color tagColor = Colors.grey;
            if (tag.color != null && tag.color!.startsWith('#')) {
              tagColor = Color(int.parse(tag.color!.substring(1, 7), radix: 16) + 0xFF000000);
            }
            
            return Container(
              padding: const EdgeInsets.all(16),
              color: tagColor.withOpacity(0.1),
              child: Row(
                children: [
                  // Tag color indicator
                  Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      color: tagColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Tag info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tag.name,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          '${tag.noteCount} note${tag.noteCount != 1 ? 's' : ''}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        
        // Notes list
        Expanded(
          child: ValueListenableBuilder<List<NoteModel>>(
            valueListenable: _tagsState.tagNotes,
            builder: (context, notes, child) {
              if (notes.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.note_outlined,
                        size: 64,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No notes with this tag',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Add this tag to notes to see them here',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                );
              }
              
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: notes.length,
                itemBuilder: (context, index) {
                  final note = notes[index];
                  return NoteTile(
                    note: note,
                    onTap: () => context.push('/notes/${note.id}'),
                    onStarTap: () => _toggleNoteStar(note),
                    onArchiveTap: () => _toggleNoteArchive(note),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
  
  Future<void> _toggleNoteStar(NoteModel note) async {
    try {
      await _tagsState.apiService.updateNote(
        note.id,
        isStarred: !note.isStarred,
      );
      
      // Reload notes
      await _tagsState.loadTagNotes(widget.tagId);
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to update note: ${e.toString()}';
      });
    }
  }
  
  Future<void> _toggleNoteArchive(NoteModel note) async {
    try {
      await _tagsState.apiService.updateNote(
        note.id,
        isArchived: !note.isArchived,
      );
      
      // Reload notes
      await _tagsState.loadTagNotes(widget.tagId);
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to update note: ${e.toString()}';
      });
    }
  }
}