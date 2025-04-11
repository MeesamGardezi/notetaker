import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/note_model.dart';
import '../models/module_model.dart';
import '../models/tag_model.dart';
import '../state/auth_state.dart';
import '../state/notes_state.dart';
import '../state/modules_state.dart';
import '../state/tags_state.dart';
import '../state/editor_state.dart';
import '../services/image_service.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/tag_chip.dart';
import '../utils/formatters.dart';

class NoteScreen extends StatefulWidget {
  final String noteId;
  final String? moduleId;
  
  const NoteScreen({
    Key? key, 
    required this.noteId,
    this.moduleId,
  }) : super(key: key);

  @override
  State<NoteScreen> createState() => _NoteScreenState();
}

class _NoteScreenState extends State<NoteScreen> {
  late NotesState _notesState;
  late ModulesState _modulesState;
  late TagsState _tagsState;
  late EditorState _editorState;
  late ImageService _imageService;
  
  bool _isLoading = true;
  String? _errorMessage;
  
  NoteModel? _note;
  ModuleModel? _module;
  List<TagModel> _noteTags = [];
  List<TagModel> _allTags = [];
  
  bool _isEditingTitle = false;
  final TextEditingController _titleController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    
    // Initialize states
    _initializeStates();
  }
  
  void _initializeStates() async {
    // Get auth state
    final authState = AuthState.of(context);
    
    // Create states
    _notesState = NotesState(
      apiService: authState.apiService,
      storageService: authState.storageService,
    );
    
    _modulesState = ModulesState(
      apiService: authState.apiService,
      storageService: authState.storageService,
    );
    
    _tagsState = TagsState(
      apiService: authState.apiService,
      storageService: authState.storageService,
    );
    
    _editorState = EditorState(
      apiService: authState.apiService,
      onNoteSaved: _handleNoteSaved,
    );
    
    _imageService = ImageService(apiService: authState.apiService);
    
    // Load data
    setState(() => _isLoading = true);
    
    try {
      // Load note
      _note = await _notesState.getNote(widget.noteId);
      
      if (_note == null) {
        setState(() {
          _errorMessage = 'Note not found';
          _isLoading = false;
        });
        return;
      }
      
      // Set title controller
      _titleController.text = _note!.title;
      
      // Initialize editor with note
      _editorState.initWithNote(_note!);
      
      // Load module
      await _modulesState.loadModules();
      _module = _modulesState.getModuleById(_note!.moduleId);
      
      // Load tags
      await _tagsState.loadTags();
      _allTags = _tagsState.tags.value;
      
      // Get note tags
      _noteTags = _allTags.where((tag) => 
        _note!.tags.contains(tag.id)
      ).toList();
      
      setState(() {
        _isLoading = false;
        _errorMessage = null;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load note: ${e.toString()}';
      });
    }
  }
  
  // Handle note save events from editor
  void _handleNoteSaved(NoteModel updatedNote) {
    setState(() {
      _note = updatedNote;
    });
  }
  
  void _toggleEditTitle() {
    setState(() {
      if (_isEditingTitle) {
        // Save title on toggle off
        _saveTitle();
      } else {
        _titleController.text = _note?.title ?? '';
      }
      _isEditingTitle = !_isEditingTitle;
    });
  }
  
  Future<void> _saveTitle() async {
    if (_note == null) return;
    
    final newTitle = _titleController.text.trim();
    if (newTitle.isEmpty || newTitle == _note!.title) return;
    
    try {
      setState(() => _isLoading = true);
      
      final updatedNote = await _notesState.updateNote(
        _note!.id,
        title: newTitle,
      );
      
      if (updatedNote != null) {
        setState(() {
          _note = updatedNote;
          _isLoading = false;
        });
      } else {
        setState(() {
          _titleController.text = _note!.title;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _titleController.text = _note!.title;
        _isLoading = false;
        _errorMessage = 'Failed to update title: ${e.toString()}';
      });
    }
  }
  
  Future<void> _toggleStar() async {
    if (_note == null) return;
    
    try {
      setState(() => _isLoading = true);
      
      final updatedNote = await _notesState.updateNote(
        _note!.id,
        isStarred: !_note!.isStarred,
      );
      
      if (updatedNote != null) {
        setState(() {
          _note = updatedNote;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to update star status: ${e.toString()}';
      });
    }
  }
  
  Future<void> _toggleArchive() async {
    if (_note == null) return;
    
    try {
      setState(() => _isLoading = true);
      
      final updatedNote = await _notesState.updateNote(
        _note!.id,
        isArchived: !_note!.isArchived,
      );
      
      if (updatedNote != null) {
        setState(() {
          _note = updatedNote;
          _isLoading = false;
        });
        
        if (_note!.isArchived) {
          // Show snackbar with undo option
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Note archived'),
              action: SnackBarAction(
                label: 'Undo',
                onPressed: _toggleArchive,
              ),
            ),
          );
        }
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to update archive status: ${e.toString()}';
      });
    }
  }
  
  void _showDeleteDialog() {
    if (_note == null) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Note'),
        content: Text(
          'Are you sure you want to delete "${_note!.title}"? '
          'This action cannot be undone.',
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
              _deleteNote();
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _deleteNote() async {
    if (_note == null) return;
    
    try {
      setState(() => _isLoading = true);
      
      final success = await _notesState.deleteNote(_note!.id);
      
      if (success && mounted) {
        // Navigate back
        context.pop();
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Failed to delete note';
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to delete note: ${e.toString()}';
      });
    }
  }
  
  void _showTagsDialog() {
    if (_note == null) return;
    
    // Create a set to track selected tags
    final selectedTagIds = Set<String>.from(_note!.tags);
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Manage Tags'),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Search field
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search tags...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) {
                    // Filter tags based on search
                    setState(() {
                      // This would be implemented to filter _allTags
                    });
                  },
                ),
                const SizedBox(height: 16),
                
                // Selected tags section
                if (selectedTagIds.isNotEmpty) ...[
                  const Text(
                    'Selected Tags:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _allTags
                      .where((tag) => selectedTagIds.contains(tag.id))
                      .map((tag) => TagChip(
                        tag: tag,
                        showDelete: true,
                        onDelete: () {
                          setState(() {
                            selectedTagIds.remove(tag.id);
                          });
                        },
                      ))
                      .toList(),
                  ),
                  const Divider(height: 24),
                ],
                
                // Available tags section
                const Text(
                  'Available Tags:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                
                // List of available tags
                SizedBox(
                  height: 200,
                  child: ListView.builder(
                    itemCount: _allTags.length,
                    itemBuilder: (context, index) {
                      final tag = _allTags[index];
                      final isSelected = selectedTagIds.contains(tag.id);
                      
                      return CheckboxListTile(
                        title: Text(tag.name),
                        value: isSelected,
                        secondary: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: tag.color != null
                                ? Color(int.parse(tag.color!.substring(1, 7), radix: 16) + 0xFF000000)
                                : Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        onChanged: (value) {
                          setState(() {
                            if (value == true) {
                              selectedTagIds.add(tag.id);
                            } else {
                              selectedTagIds.remove(tag.id);
                            }
                          });
                        },
                      );
                    },
                  ),
                ),
                
                // Create new tag button
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Create New Tag'),
                    onPressed: () {
                      Navigator.pop(context);
                      _showCreateTagDialog().then((newTag) {
                        if (newTag != null) {
                          _showTagsDialog();
                        }
                      });
                    },
                  ),
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
              onPressed: () {
                Navigator.pop(context);
                _updateNoteTags(selectedTagIds.toList());
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
  
  Future<TagModel?> _showCreateTagDialog() async {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController();
    String? selectedColor = '#9C27B0'; // Default color
    
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
    
    TagModel? newTag;
    
    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Create Tag'),
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
                          color: Color(int.parse(color.substring(1, 7), radix: 16) + 0xFF000000),
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
                  
                  try {
                    newTag = await _tagsState.createTag(
                      name,
                      color: selectedColor,
                    );
                    
                    if (newTag != null && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Tag created successfully'),
                        ),
                      );
                      
                      // Update all tags list
                      _allTags = _tagsState.tags.value;
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Failed to create tag: ${e.toString()}'),
                          backgroundColor: Theme.of(context).colorScheme.error,
                        ),
                      );
                    }
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
    
    return newTag;
  }
  
  Future<void> _updateNoteTags(List<String> tagIds) async {
    if (_note == null) return;
    
    try {
      setState(() => _isLoading = true);
      
      final updatedNote = await _notesState.updateNote(
        _note!.id,
        tags: tagIds,
      );
      
      if (updatedNote != null) {
        setState(() {
          _note = updatedNote;
          
          // Update note tags
          _noteTags = _allTags.where((tag) => 
            _note!.tags.contains(tag.id)
          ).toList();
          
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to update tags: ${e.toString()}';
      });
    }
  }
  
  void _showMoveToModuleDialog() {
    if (_note == null) return;
    
    final modules = _modulesState.modules.value
        .where((m) => !m.isArchived && m.id != _note!.moduleId)
        .toList();
    
    if (modules.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No other modules available'),
        ),
      );
      return;
    }
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Move Note'),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select a module to move "${_note!.title}" to:',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              
              SizedBox(
                height: 200,
                child: ListView.builder(
                  itemCount: modules.length,
                  itemBuilder: (context, index) {
                    final module = modules[index];
                    
                    // Parse module color if available
                    Color? moduleColor;
                    if (module.color != null && module.color!.startsWith('#')) {
                      moduleColor = Color(int.parse(module.color!.substring(1, 7), radix: 16) + 0xFF000000);
                    }
                    
                    return ListTile(
                      leading: Icon(
                        Icons.folder,
                        color: moduleColor,
                      ),
                      title: Text(module.title),
                      subtitle: module.description != null
                          ? Text(
                              module.description!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            )
                          : null,
                      onTap: () {
                        Navigator.pop(context);
                        _moveNoteToModule(module.id);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _moveNoteToModule(String moduleId) async {
    if (_note == null) return;
    
    try {
      setState(() => _isLoading = true);
      
      final updatedNote = await _notesState.updateNote(
        _note!.id,
        moduleId: moduleId,
      );
      
      if (updatedNote != null) {
        setState(() {
          _note = updatedNote;
          
          // Update module
          _module = _modulesState.getModuleById(moduleId);
          
          _isLoading = false;
        });
        
        // Show success message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Note moved to ${_module?.title ?? 'new module'}'),
            ),
          );
        }
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to move note: ${e.toString()}';
      });
    }
  }
  
  @override
  void dispose() {
    _notesState.dispose();
    _modulesState.dispose();
    _tagsState.dispose();
    _editorState.dispose();
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Parse module color if available
    Color? moduleColor;
    if (_module?.color != null && _module!.color!.startsWith('#')) {
      moduleColor = Color(int.parse(_module!.color!.substring(1, 7), radix: 16) + 0xFF000000);
    }
    
    return Scaffold(
      appBar: CustomAppBar(
        title: _module?.title ?? 'Note',
        showBackButton: true,
        backgroundColor: moduleColor?.withOpacity(0.8),
        foregroundColor: moduleColor != null ? Colors.white : null,
        actions: [
          // Star button
          if (_note != null)
            IconButton(
              icon: Icon(
                _note!.isStarred ? Icons.star : Icons.star_border,
                color: _note!.isStarred ? Colors.amber : null,
              ),
              onPressed: _toggleStar,
              tooltip: 'Star',
            ),
          
          // More options
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'tags':
                  _showTagsDialog();
                  break;
                case 'move':
                  _showMoveToModuleDialog();
                  break;
                case 'archive':
                  _toggleArchive();
                  break;
                case 'delete':
                  _showDeleteDialog();
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'tags',
                child: Row(
                  children: [
                    Icon(Icons.tag, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    const Text('Manage Tags'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'move',
                child: Row(
                  children: [
                    Icon(Icons.drive_file_move, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    const Text('Move to Module'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'archive',
                child: Row(
                  children: [
                    Icon(
                      _note?.isArchived == true ? Icons.unarchive : Icons.archive,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(_note?.isArchived == true ? 'Unarchive' : 'Archive'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: theme.colorScheme.error),
                    const SizedBox(width: 8),
                    const Text('Delete'),
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
                    onPressed: _initializeStates,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _buildNoteContent(),
    );
  }
  
  Widget _buildNoteContent() {
    if (_note == null) {
      return const Center(child: Text('Note not found'));
    }
    
    return Column(
      children: [
        // Title section
        Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title (editable)
              GestureDetector(
                onTap: _toggleEditTitle,
                child: _isEditingTitle
                    ? TextField(
                        controller: _titleController,
                        style: Theme.of(context).textTheme.headlineSmall,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        onSubmitted: (_) => _toggleEditTitle(),
                        autofocus: true,
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: Text(
                              _note!.title,
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: _toggleEditTitle,
                            visualDensity: VisualDensity.compact,
                          ),
                        ],
                      ),
              ),
              
              const SizedBox(height: 8),
              
              // Last updated info
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Last updated: ${Formatters.formatDateTime(_note!.updatedAt)}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
              
              // Tags section
              if (_noteTags.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _noteTags.map((tag) => TagChip(tag: tag)).toList(),
                ),
              ],
            ],
          ),
        ),
        
        const Divider(height: 1),
        
        // Content section
        Expanded(
          child: ValueListenableBuilder<bool>(
            valueListenable: _editorState.isEditing,
            builder: (context, isEditing, child) {
              return Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Edit button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          icon: Icon(isEditing ? Icons.save : Icons.edit),
                          label: Text(isEditing ? 'Save' : 'Edit'),
                          onPressed: () {
                            if (isEditing) {
                              _editorState.saveChanges();
                            } else {
                              _editorState.startEditing();
                            }
                          },
                        ),
                      ],
                    ),
                    
                    // Editor placeholder
                    Expanded(
                      child: Center(
                        child: Text(
                          'Note content editor would go here\n(Editor implementation required)',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}