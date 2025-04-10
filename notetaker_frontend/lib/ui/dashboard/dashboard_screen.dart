// notetaker_frontend/lib/ui/dashboard/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../models/module.dart';
import '../../models/note.dart';
import '../../models/user.dart';
import '../../notifiers/auth_notifier.dart';
import '../../notifiers/module_notifier.dart';
import '../../notifiers/note_notifier.dart';
import '../shared/styles.dart';
import '../shared/widgets/app_button.dart';
import '../shared/widgets/loading_indicator.dart';

class DashboardScreen extends StatefulWidget {
  final AuthNotifier authNotifier;
  final ModuleNotifier moduleNotifier;
  final NoteNotifier noteNotifier;
  
  const DashboardScreen({
    Key? key,
    required this.authNotifier,
    required this.moduleNotifier,
    required this.noteNotifier,
  }) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    final userId = widget.authNotifier.currentUser.value?.id;
    if (userId != null) {
      widget.moduleNotifier.loadModules(userId);
      widget.noteNotifier.loadRecentNotes(userId);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.appName),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push(AppRoutes.settings),
          ),
        ],
      ),
      body: ValueListenableBuilder<User?>(
        valueListenable: widget.authNotifier.currentUser,
        builder: (context, user, _) {
          if (user == null) {
            return const Center(child: Text('Not logged in'));
          }
          
          return RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: Paddings.page,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildWelcomeSection(user),
                  const SizedBox(height: AppTheme.spacingL),
                  _buildModulesSection(),
                  const SizedBox(height: AppTheme.spacingL),
                  _buildRecentNotesSection(),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push(AppRoutes.createModule),
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add),
      ),
    );
  }
  
  Widget _buildWelcomeSection(User user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Welcome, ${user.displayName}',
          style: TextStyles.heading2,
        ),
        const SizedBox(height: AppTheme.spacingXs),
        Text(
          '${user.moduleCount} modules, ${user.noteCount} notes',
          style: TextStyles.body.copyWith(color: AppTheme.textSecondary),
        ),
        const SizedBox(height: AppTheme.spacingS),
        LinearProgressIndicator(
          value: user.storageUsagePercentage / 100,
          backgroundColor: AppTheme.surfaceColor,
          valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
        ),
        const SizedBox(height: AppTheme.spacingXs),
        Text(
          '${user.storageUsageFormatted} of ${user.storageLimitFormatted} used',
          style: TextStyles.bodySmall,
        ),
      ],
    );
  }
  
  Widget _buildModulesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              AppStrings.modules,
              style: TextStyles.heading3,
            ),
            AppButton(
              label: AppStrings.newModule,
              onPressed: () => context.push(AppRoutes.createModule),
              type: AppButtonType.text,
              icon: Icons.add,
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacingM),
        ValueListenableBuilder<List<Module>>(
          valueListenable: widget.moduleNotifier.modules,
          builder: (context, modules, _) {
            return ValueListenableBuilder<bool>(
              valueListenable: widget.moduleNotifier.isLoading,
              builder: (context, isLoading, _) {
                if (isLoading) {
                  return const Center(
                    child: LoadingIndicator(message: AppStrings.loading),
                  );
                }
                
                if (modules.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.folder_outlined,
                          size: 64,
                          color: AppTheme.secondaryColor,
                        ),
                        const SizedBox(height: AppTheme.spacingM),
                        const Text(
                          AppStrings.noModules,
                          style: TextStyles.body,
                        ),
                        const SizedBox(height: AppTheme.spacingM),
                        AppButton(
                          label: AppStrings.createFirstModule,
                          onPressed: () => context.push(AppRoutes.createModule),
                          type: AppButtonType.secondary,
                        ),
                      ],
                    ),
                  );
                }
                
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: AppTheme.spacingM,
                    mainAxisSpacing: AppTheme.spacingM,
                    childAspectRatio: 1.3,
                  ),
                  itemCount: modules.length,
                  itemBuilder: (context, index) {
                    final module = modules[index];
                    return _buildModuleCard(module);
                  },
                );
              },
            );
          },
        ),
      ],
    );
  }
  
  Widget _buildModuleCard(Module module) {
    return InkWell(
      onTap: () => context.go('${AppRoutes.modules}/${module.id}'),
      borderRadius: BorderRadius.circular(AppTheme.radiusM),
      child: Container(
        padding: Paddings.card,
        decoration: Decorations.moduleCard(module.color),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.folder, color: module.color),
                const SizedBox(width: AppTheme.spacingS),
                Expanded(
                  child: Text(
                    module.name,
                    style: TextStyles.heading3,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            if (module.description.isNotEmpty) ...[
              const SizedBox(height: AppTheme.spacingS),
              Text(
                module.description,
                style: TextStyles.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${module.noteCount} notes',
                  style: TextStyles.bodySmall,
                ),
                Text(
                  'Created ${_formatDate(module.createdAt)}',
                  style: TextStyles.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildRecentNotesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppStrings.recentNotes,
          style: TextStyles.heading3,
        ),
        const SizedBox(height: AppTheme.spacingM),
        ValueListenableBuilder<List<Note>>(
          valueListenable: widget.noteNotifier.recentNotes,
          builder: (context, notes, _) {
            if (notes.isEmpty) {
              return const SizedBox(
                height: 100,
                child: Center(
                  child: Text('No recent notes'),
                ),
              );
            }
            
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: notes.length,
              separatorBuilder: (context, index) => const Divider(),
              itemBuilder: (context, index) {
                final note = notes[index];
                return _buildNoteListItem(note);
              },
            );
          },
        ),
      ],
    );
  }
  
  Widget _buildNoteListItem(Note note) {
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Text(
            'Last edited ${_formatDate(note.updatedAt)}',
            style: TextStyles.caption,
          ),
        ],
      ),
      trailing: note.mediaFiles.isNotEmpty
          ? const Icon(Icons.attachment, size: 16, color: AppTheme.textHint)
          : null,
      onTap: () => context.go('${AppRoutes.modules}/${note.moduleId}/notes/${note.id}'),
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