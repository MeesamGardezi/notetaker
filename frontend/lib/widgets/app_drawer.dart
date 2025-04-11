import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/tag_model.dart';
import '../state/auth_state.dart';
import '../state/tags_state.dart';

class AppDrawer extends StatefulWidget {
  const AppDrawer({Key? key}) : super(key: key);

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  late TagsState _tagsState;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _initializeTagsState();
  }
  
  void _initializeTagsState() async {
    // Get auth state
    final authState = AuthState.of(context);
    
    // Create tags state
    _tagsState = TagsState(
      apiService: authState.apiService,
      storageService: authState.storageService,
    );
    
    // Load tags
    setState(() => _isLoading = true);
    
    try {
      await _tagsState.loadTags();
      
      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
    final authState = AuthState.of(context);
    final user = authState.user;
    
    return Drawer(
      child: Column(
        children: [
          // Drawer header with user info
          UserAccountsDrawerHeader(
            accountName: Text(user?.displayName ?? 'User'),
            accountEmail: Text(user?.email ?? ''),
            currentAccountPicture: CircleAvatar(
              backgroundColor: theme.colorScheme.primary,
              child: Text(
                (user?.displayName?.isNotEmpty == true)
                    ? user!.displayName[0].toUpperCase()
                    : 'U',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
            ),
          ),
          
          // Navigation items
          ListTile(
            leading: const Icon(Icons.home_outlined),
            title: const Text('Home'),
            onTap: () {
              context.go('/home');
            },
          ),
          
          // Divider before tags section
          const Divider(),
          
          // Tags section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tags',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add, size: 20),
                  onPressed: _showAddTagDialog,
                  tooltip: 'Add Tag',
                ),
              ],
            ),
          ),
          
          // Tags list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ValueListenableBuilder<List<TagModel>>(
                    valueListenable: _tagsState.tags,
                    builder: (context, tags, child) {
                      if (tags.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Text(
                              'No tags yet',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ),
                        );
                      }
                      
                      return ListView.builder(
                        padding: EdgeInsets.zero,
                        itemCount: tags.length,
                        itemBuilder: (context, index) {
                          final tag = tags[index];
                          
                          return ListTile(
                            leading: Icon(
                              Icons.tag,
                              color: tag.color != null
                                  ? Color(int.parse(tag.color!.substring(1, 7), radix: 16) + 0xFF000000)
                                  : null,
                            ),
                            title: Text(tag.name),
                            trailing: Text(
                              tag.noteCount.toString(),
                              style: TextStyle(
                                color: Colors.grey.shade600,
                              ),
                            ),
                            onTap: () {
                              context.push('/tags/${tag.id}');
                            },
                          );
                        },
                      );
                    },
                  ),
          ),
          
          // Divider before bottom section
          const Divider(),
          
          // Bottom navigation items
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Profile'),
            onTap: () {
              context.push('/profile');
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Settings'),
            onTap: () {
              context.push('/settings');
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Logout'),
            onTap: () async {
              // Close drawer
              Navigator.pop(context);
              
              // Show confirmation dialog
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );
              
              if (confirmed == true) {
                // Logout user
                await authState.logout();
              }
            },
          ),
          
          // App version at bottom
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Version 1.0.0',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  void _showAddTagDialog() {
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
    
    showDialog(
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
                    await _tagsState.createTag(
                      name,
                      color: selectedColor,
                    );
                    
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Tag created successfully'),
                        ),
                      );
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
  }
}