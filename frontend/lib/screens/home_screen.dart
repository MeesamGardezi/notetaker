import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/module_model.dart';
import '../models/note_model.dart';
import '../state/auth_state.dart';
import '../state/modules_state.dart';
import '../state/notes_state.dart';
import '../widgets/app_drawer.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/module_tile.dart';
import '../widgets/note_tile.dart';

class HomeScreen extends StatefulWidget {
  final String? searchQuery;
  
  const HomeScreen({Key? key, this.searchQuery}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  
  bool _isSearching = false;
  bool _isLoading = true;
  String? _errorMessage;
  
  // States
  late ModulesState _modulesState;
  late NotesState _notesState;
  
  // Searched notes
  List<NoteModel> _searchResults = [];
  
  @override
  void initState() {
    super.initState();
    
    // Initialize tab controller
    _tabController = TabController(length: 3, vsync: this);
    
    // Initialize states
    _initializeStates();
    
    // Set search query if provided
    if (widget.searchQuery != null && widget.searchQuery!.isNotEmpty) {
      _searchController.text = widget.searchQuery!;
      _isSearching = true;
      _performSearch();
    }
  }
  
  void _initializeStates() async {
    // Get auth state
    final authState = AuthState.of(context);
    
    // Create states
    _modulesState = ModulesState(
      apiService: authState.apiService,
      storageService: authState.storageService,
    );
    
    _notesState = NotesState(
      apiService: authState.apiService,
      storageService: authState.storageService,
    );
    
    // Load data
    setState(() => _isLoading = true);
    
    try {
      await Future.wait([
        _modulesState.loadModules(),
        _notesState.loadRecentNotes(),
        _notesState.loadStarredNotes(),
      ]);
      
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
      final results = await _notesState.searchNotes(query);
      
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
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final note = _searchResults[index];
        return NoteTile(
          note: note,
          onTap: () => context.push('/notes/${note.id}'),
        );
      },
    );
  }
  
  Widget _buildModulesTab() {
    return ValueListenableBuilder<List<ModuleModel>>(
      valueListenable: _modulesState.modules,
      builder: (context, modules, child) {
        if (_modulesState.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        
        if (modules.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.folder_outlined,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No modules yet',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Create your first module to get started',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _showAddModuleDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Create Module'),
                ),
              ],
            ),
          );
        }
        
        // Only show non-archived modules
        final activeModules = modules.where((m) => !m.isArchived).toList();
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: activeModules.length + 1, // +1 for add button
          itemBuilder: (context, index) {
            if (index == activeModules.length) {
              // Last item is add button
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                child: OutlinedButton(
                  onPressed: _showAddModuleDialog,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add),
                      SizedBox(width: 8),
                      Text('Add Module'),
                    ],
                  ),
                ),
              );
            }
            
            final module = activeModules[index];
            return ModuleTile(
              module: module,
              onTap: () => context.push('/modules/${module.id}'),
            );
          },
        );
      },
    );
  }
  
  Widget _buildRecentNotesTab() {
    return ValueListenableBuilder<List<NoteModel>>(
      valueListenable: _notesState.recentNotes,
      builder: (context, notes, child) {
        if (_notesState.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        
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
                  'No recent notes',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your recently edited notes will appear here',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
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
            );
          },
        );
      },
    );
  }
  
  Widget _buildStarredNotesTab() {
    return ValueListenableBuilder<List<NoteModel>>(
      valueListenable: _notesState.starredNotes,
      builder: (context, notes, child) {
        if (_notesState.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        
        if (notes.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.star_outline,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No starred notes',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Star your important notes to find them quickly',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
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
            );
          },
        );
      },
    );
  }
  
  void _showAddModuleDialog() {
    final formKey = GlobalKey<FormState>();
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Module'),
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
                
                final newModule = await _modulesState.createModule(
                  title,
                  description: description,
                );
                
                if (newModule != null && mounted) {
                  context.push('/modules/${newModule.id}');
                }
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _modulesState.dispose();
    _notesState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: CustomAppBar(
        title: _isSearching ? '' : 'Notes App',
        showBackButton: false,
        actions: [
          // Search button/field
          if (_isSearching)
            Expanded(
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search notes...',
                  border: InputBorder.none,
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: _clearSearch,
                  ),
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
            
          // Settings button
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/settings'),
          ),
        ],
        bottom: _isSearching
            ? null
            : TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Modules'),
                  Tab(text: 'Recent'),
                  Tab(text: 'Starred'),
                ],
              ),
      ),
      drawer: const AppDrawer(),
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
          : _isSearching
              ? _buildSearchResults()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildModulesTab(),
                    _buildRecentNotesTab(),
                    _buildStarredNotesTab(),
                  ],
                ),
      floatingActionButton: !_isSearching
          ? FloatingActionButton(
              onPressed: () {
                // Check which tab is selected to determine the action
                if (_tabController.index == 0) {
                  _showAddModuleDialog();
                } else {
                  // Open quick note creation if a module exists
                  if (_modulesState.modules.value.isNotEmpty) {
                    // Show module selection for new note
                    _showModuleSelectionForNewNote();
                  } else {
                    // Show message that a module is needed first
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Create a module first to add notes'),
                      ),
                    );
                  }
                }
              },
              child: Icon(
                _tabController.index == 0 ? Icons.create_new_folder : Icons.note_add,
              ),
            )
          : null,
    );
  }
  
  void _showModuleSelectionForNewNote() {
    final modules = _modulesState.modules.value
        .where((m) => !m.isArchived)
        .toList();
    
    if (modules.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No active modules found'),
        ),
      );
      return;
    }
    
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Select a module for your note',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const Divider(),
          Expanded(
            child: ListView.builder(
              itemCount: modules.length,
              itemBuilder: (context, index) {
                final module = modules[index];
                return ListTile(
                  leading: Icon(
                    Icons.folder,
                    color: module.color != null
                        ? Color(int.parse(module.color!.substring(1, 7), radix: 16) + 0xFF000000)
                        : null,
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
                    
                    // Create a new note in the selected module
                    _createNewNote(module.id);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  
  void _createNewNote(String moduleId) async {
    // Show loading indicator
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Creating new note...'),
        duration: Duration(seconds: 1),
      ),
    );
    
    try {
      // Create a new note
      final note = await _notesState.createNote(
        moduleId,
        'New Note',
      );
      
      if (note != null && mounted) {
        // Navigate to the new note
        context.push('/notes/${note.id}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create note: ${e.toString()}'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
}