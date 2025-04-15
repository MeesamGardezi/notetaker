import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/module_model.dart';
import '../models/note_model.dart';
import '../state/auth_state.dart';
import '../state/modules_state.dart';
import '../state/notes_state.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/note_tile.dart';

class ModuleScreen extends StatefulWidget {
  final String moduleId;
  final AuthState authState;
  
  const ModuleScreen({
    Key? key, 
    required this.moduleId,
    required this.authState,
  }) : super(key: key);

  @override
  State<ModuleScreen> createState() => _ModuleScreenState();
}

class _ModuleScreenState extends State<ModuleScreen> {
  late ModulesState _modulesState;
  late NotesState _notesState;
  
  bool _isLoading = true;
  String? _errorMessage;
  bool _showArchived = false;
  
  ModuleModel? _module;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  List<NoteModel> _searchResults = [];
  
  @override
  void initState() {
    super.initState();
    
    // Initialize states
    _initializeStates();
  }
  
  void _initializeStates() async {
    // Create states using the passed authState
    _modulesState = ModulesState(
      apiService: widget.authState.apiService,
      storageService: widget.authState.storageService,
    );
    
    _notesState = NotesState(
      apiService: widget.authState.apiService,
      storageService: widget.authState.storageService,
    );
    
    // Load data
    setState(() => _isLoading = true);
    
    try {
      // Load modules first to get module details
      await _modulesState.loadModules();
      
      // Find the specific module
      _module = _modulesState.getModuleById(widget.moduleId);
      
      if (_module == null) {
        setState(() {
          _errorMessage = 'Module not found';
          _isLoading = false;
        });
        return;
      }
      
      // Load notes for this module
      await _notesState.loadModuleNotes(widget.moduleId);
      
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
  
  void _performSearch() async {
    final query = _searchController.text.trim();
    
    if (query.isEmpty) {
      setState(() {
        _isSearching = false;
        _searchResults = [];
      });
      return;
    }
    
    setState(() {
      _isLoading = true;
      _isSearching = true;
    });
    
    try {
      final results = await _notesState.searchNotes(
        query,
        moduleId: widget.moduleId,
      );
      
      setState(() {
        _searchResults = results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Search failed: ${e.toString()}';
        _isLoading = false;
      });
    }
  }
  
  void _clearSearch() {
    setState(() {
      _searchController.clear();
      _isSearching = false;
      _searchResults = [];
    });
  }
  
  void _toggleArchived() async {
    setState(() => _showArchived = !_showArchived);
    
    _notesState.includeArchived.value = _showArchived;
    await _notesState.loadModuleNotes(widget.moduleId);
  }
  
  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 16, bottom: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
  
  void _showAddNoteDialog() {
    final formKey = GlobalKey<FormState>();
    final titleController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Note'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  hintText: 'Enter note title',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a title';
                  }
                  return null;
                },
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
                final title = titleController.text;
                
                Navigator.pop(context);
                
                // Create new note
                await _createNote(title);
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _createNote(String title) async {
    try {
      setState(() => _isLoading = true);
      
      final newNote = await _notesState.createNote(
        widget.moduleId,
        title,
      );
      
      setState(() => _isLoading = false);
      
      if (newNote != null && mounted) {
        // Navigate to the new note
        context.push('/notes/${newNote.id}');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to create note: ${e.toString()}';
      });
    }
  }
  
  void _showEditModuleDialog() {
    if (_module == null) return;
    
    final formKey = GlobalKey<FormState>();
    final titleController = TextEditingController(text: _module!.title);
    final descriptionController = TextEditingController(text: _module!.description ?? '');
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Module'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  hintText: 'Enter module title',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description (Optional)',
                  hintText: 'Enter module description',
                ),
                maxLines: 2,
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
                final title = titleController.text;
                final description = descriptionController.text.isEmpty 
                    ? null 
                    : descriptionController.text;
                
                Navigator.pop(context);
                
                // Update module
                await _updateModule(title, description);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _updateModule(String title, String? description) async {
    try {
      setState(() => _isLoading = true);
      
      await _modulesState.updateModule(
        widget.moduleId,
        title: title,
        description: description,
      );
      
      // Refresh module
      _module = _modulesState.getModuleById(widget.moduleId);
      
      setState(() {
        _isLoading = false;
        _errorMessage = null;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to update module: ${e.toString()}';
      });
    }
  }
  
  void _showDeleteModuleDialog() {
    if (_module == null) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Module'),
        content: Text(
          'Are you sure you want to delete "${_module!.title}"? '
          'This will permanently delete all notes in this module.',
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
            onPressed: () async {
              Navigator.pop(context);
              
              // Delete module
              await _deleteModule();
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _deleteModule() async {
    try {
      setState(() => _isLoading = true);
      
      final success = await _modulesState.deleteModule(widget.moduleId);
      
      setState(() => _isLoading = false);
      
      if (success && mounted) {
        // Navigate back
        context.go('/home');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to delete module: ${e.toString()}';
      });
    }
  }
  
  Future<void> _toggleNoteArchive(NoteModel note) async {
    try {
      await _notesState.updateNote(
        note.id,
        isArchived: !note.isArchived,
      );
      
      // Reload notes
      await _notesState.loadModuleNotes(widget.moduleId);
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to update note: ${e.toString()}';
      });
    }
  }
  
  Future<void> _toggleNoteStar(NoteModel note) async {
    try {
      await _notesState.updateNote(
        note.id,
        isStarred: !note.isStarred,
      );
      
      // Reload notes
      await _notesState.loadModuleNotes(widget.moduleId);
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to update note: ${e.toString()}';
      });
    }
  }
  
  void _showDeleteNoteDialog(NoteModel note) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Note'),
        content: Text(
          'Are you sure you want to delete "${note.title}"? '
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
            onPressed: () async {
              Navigator.pop(context);
              
              // Delete note
              await _deleteNote(note.id);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _deleteNote(String noteId) async {
    try {
      setState(() => _isLoading = true);
      
      final success = await _notesState.deleteNote(noteId);
      
      if (success) {
        // Reload notes
        await _notesState.loadModuleNotes(widget.moduleId);
      }
      
      setState(() {
        _isLoading = false;
        _errorMessage = null;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to delete note: ${e.toString()}';
      });
    }
  }
  
  @override
  void dispose() {
    _modulesState.dispose();
    _notesState.dispose();
    _searchController.dispose();
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
        title: _isSearching ? '' : (_module?.title ?? 'Module'),
        showBackButton: true,
        backgroundColor: moduleColor?.withOpacity(0.8),
        foregroundColor: moduleColor != null ? Colors.white : null,
        actions: [
          // Search button/field
          if (_isSearching)
            Expanded(
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search notes...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(
                    color: moduleColor != null 
                        ? Colors.white.withOpacity(0.7) 
                        : null,
                  ),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: _clearSearch,
                    color: moduleColor != null ? Colors.white : null,
                  ),
                ),
                style: TextStyle(
                  color: moduleColor != null ? Colors.white : null,
                ),
                autofocus: true,
                onSubmitted: (_) => _performSearch(),
                textInputAction: TextInputAction.search,
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () {
                setState(() {
                  _isSearching = true;
                });
              },
            ),
          
          // More options
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'edit':
                  _showEditModuleDialog();
                  break;
                case 'archived':
                  _toggleArchived();
                  break;
                case 'delete':
                  _showDeleteModuleDialog();
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
                    const Text('Edit Module'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'archived',
                child: Row(
                  children: [
                    Icon(
                      _showArchived ? Icons.visibility_off : Icons.visibility,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(_showArchived ? 'Hide Archived' : 'Show Archived'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: theme.colorScheme.error),
                    const SizedBox(width: 8),
                    const Text('Delete Module'),
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
              : _buildBody(),
      floatingActionButton: !_isSearching && !_isLoading && _errorMessage == null
          ? FloatingActionButton(
              onPressed: _showAddNoteDialog,
              backgroundColor: moduleColor,
              foregroundColor: moduleColor != null ? Colors.white : null,
              child: const Icon(Icons.note_add),
            )
          : null,
    );
  }
  
  Widget _buildBody() {
    if (_isSearching) {
      return _buildSearchResults();
    }
    
    return ValueListenableBuilder<List<NoteModel>>(
      valueListenable: _notesState.moduleNotes,
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
                  'No notes yet',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Create your first note to get started',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _showAddNoteDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Create Note'),
                ),
              ],
            ),
          );
        }
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Module details card
            if (_module != null)
              Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_module!.description != null && _module!.description!.isNotEmpty) ...[
                        Text(
                          'Description',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(_module!.description!),
                        const Divider(height: 24),
                      ],
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Notes: ${_module!.noteCount}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            _showArchived ? 'Showing archived' : 'Hiding archived',
                            style: TextStyle(
                              fontStyle: FontStyle.italic,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
            _buildSectionHeader('Notes'),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: notes.length,
                itemBuilder: (context, index) {
                  final note = notes[index];
                  return NoteTile(
                    note: note,
                    onTap: () => context.push('/notes/${note.id}'),
                    onStarTap: () => _toggleNoteStar(note),
                    onArchiveTap: () => _toggleNoteArchive(note),
                    onDeleteTap: () => _showDeleteNoteDialog(note),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
  
  Widget _buildSearchResults() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try a different search term',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
      );
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Search Results'),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final note = _searchResults[index];
              return NoteTile(
                note: note,
                onTap: () => context.push('/notes/${note.id}'),
                onStarTap: () => _toggleNoteStar(note),
                onArchiveTap: () => _toggleNoteArchive(note),
                onDeleteTap: () => _showDeleteNoteDialog(note),
              );
            },
          ),
        ),
      ],
    );
  }
}