// notetaker_frontend/lib/ui/modules/module_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../models/module.dart';
import '../../models/note.dart';
import '../../notifiers/module_notifier.dart';
import '../../notifiers/note_notifier.dart';
import '../shared/styles.dart';
import '../shared/widgets/app_button.dart';
import '../shared/widgets/loading_indicator.dart';

class ModuleScreen extends StatefulWidget {
  final String moduleId;
  final ModuleNotifier moduleNotifier;
  final NoteNotifier noteNotifier;
  
  const ModuleScreen({
    Key? key,
    required this.moduleId,
    required this.moduleNotifier,
    required this.noteNotifier,
  }) : super(key: key);

  @override
  State<ModuleScreen> createState() => _ModuleScreenState();
}

class _ModuleScreenState extends State<ModuleScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    await widget.moduleNotifier.selectModuleById(widget.moduleId);
    await widget.noteNotifier.loadNotes(widget.moduleId);
  }
  
  Future<void> _editModule() async {
    final module = widget.moduleNotifier.selectedModule.value;
    if (module == null) return;
    
    final nameController = TextEditingController(text: module.name);
    final descriptionController = TextEditingController(text: module.description);
    Color selectedColor = module.color;
    
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text(AppStrings.editModule),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AppTextField(
                      label: AppStrings.moduleName,
                      controller: nameController,
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    AppTextField(
                      label: AppStrings.moduleDescription,
                      controller: descriptionController,
                      maxLines: 3,
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    const Text(
                      AppStrings.moduleColor,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingS),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: AppTheme.moduleColors.map((color) {
                        final isSelected = selectedColor == color;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              selectedColor = color;
                            });
                          },
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: color,
                              borderRadius: BorderRadius.circular(AppTheme.radiusS),
                              border: Border.all(
                                color: isSelected ? Colors.white : color,
                                width: 2,
                              ),
                              boxShadow: isSelected ? AppTheme.shadowMedium : null,
                            ),
                            child: isSelected
                                ? const Center(
                                    child: Icon(
                                      Icons.check,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                  )
                                : null,
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
                  child: const Text(AppStrings.cancel),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context, {
                      'name': nameController.text,
                      'description': descriptionController.text,
                      'color': selectedColor,
                    });
                  },
                  child: const Text(AppStrings.save),
                ),
              ],
            );
          },
        );
      },
    );
    
    if (result != null) {
      final updatedModule = module.copyWith(
        name: result['name'],
        description: result['description'],
        color: result['color'],
        updatedAt: DateTime.now(),
      );
      
      await widget.moduleNotifier.updateModule(updatedModule);
    }
    
    nameController.dispose();
    descriptionController.dispose();
  }
  
  Future<void> _deleteModule() async {
    final module = widget.moduleNotifier.selectedModule.value;
    if (module == null) return;
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Module'),
          content: Text(
            'Are you sure you want to delete "${module.name}"? This will also delete all notes in this module. This action cannot be undone.',
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
      final success = await widget.moduleNotifier.deleteModule(module);
      if (success && mounted) {
        context.go(AppRoutes.home);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Module?>(
      valueListenable: widget.moduleNotifier.selectedModule,
      builder: (context, module, _) {
        if (module == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Module')),
            body: const Center(child: LoadingIndicator()),
          );
        }
        
        return Scaffold(
          appBar: AppBar(
            title: Text(module.name),
            backgroundColor: module.color.withOpacity(0.1),
            foregroundColor: module.color,
            actions: [
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: _editModule,
              ),
              IconButton(
                icon: const Icon(Icons.delete),
                onPressed: _deleteModule,
              ),
            ],
          ),
          body: ValueListenableBuilder<List<Note>>(
            valueListenable: widget.noteNotifier.notes,
            builder: (context, notes, _) {
              return RefreshIndicator(
                onRefresh: _loadData,
                child: notes.isEmpty
                    ? _buildEmptyState()
                    : _buildNotesList(notes),
              );
            },
          ),
          floatingActionButton: FloatingActionButton(
            onPressed: () => context.push('${AppRoutes.modules}/${module.id}/notes/create'),
            backgroundColor: module.color,
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }
  
  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: Paddings.page,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.note_outlined,
              size: 64,
              color: AppTheme.secondaryColor,
            ),
            const SizedBox(height: AppTheme.spacingM),
            const Text(
              AppStrings.noNotes,
              style: TextStyles.body,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppTheme.spacingM),
            AppButton(
              label: AppStrings.createFirstNote,
              onPressed: () {
                final module = widget.moduleNotifier.selectedModule.value;
                if (module != null) {
                  context.push('${AppRoutes.modules}/${module.id}/notes/create');
                }
              },
              type: AppButtonType.secondary,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildNotesList(List<Note> notes) {
    return ListView.separated(
      padding: Paddings.page,
      itemCount: notes.length,
      separatorBuilder: (context, index) => const Divider(),
      itemBuilder: (context, index) {
        final note = notes[index];
        return _buildNoteListItem(note);
      },
    );
  }
  
  Widget _buildNoteListItem(Note note) {
    final module = widget.moduleNotifier.selectedModule.value;
    final color = module?.color ?? AppTheme.primaryColor;
    
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        note.title,
        style: TextStyles.bodyLarge,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            note.contentPreview,
            style: TextStyles.bodySmall,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Row(
            children: [
              Text(
                _formatDate(note.updatedAt),
                style: TextStyles.caption,
              ),
              if (note.mediaFiles.isNotEmpty) ...[
                const SizedBox(width: AppTheme.spacingM),
                Icon(
                  Icons.attachment,
                  size: 12,
                  color: color.withOpacity(0.7),
                ),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  '${note.mediaFiles.length}',
                  style: TextStyles.caption,
                ),
              ],
            ],
          ),
        ],
      ),
      trailing: IconButton(
        icon: const Icon(Icons.arrow_forward_ios, size: 16),
        onPressed: () {
          context.go('${AppRoutes.modules}/${note.moduleId}/notes/${note.id}');
        },
      ),
      onTap: () {
        context.go('${AppRoutes.modules}/${note.moduleId}/notes/${note.id}');
      },
    );
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
}