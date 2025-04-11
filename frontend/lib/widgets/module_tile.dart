import 'package:flutter/material.dart';
import '../models/module_model.dart';
import '../utils/formatters.dart';

class ModuleTile extends StatelessWidget {
  final ModuleModel module;
  final VoidCallback? onTap;
  final VoidCallback? onEditTap;
  final VoidCallback? onDeleteTap;
  
  const ModuleTile({
    Key? key,
    required this.module,
    this.onTap,
    this.onEditTap,
    this.onDeleteTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Parse module color if available
    Color? moduleColor;
    if (module.color != null && module.color!.startsWith('#')) {
      moduleColor = Color(int.parse(module.color!.substring(1, 7), radix: 16) + 0xFF000000);
    }
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Module header with color
            Container(
              color: moduleColor?.withOpacity(0.8) ?? theme.colorScheme.primaryContainer,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // Module icon and title
                  Expanded(
                    child: Row(
                      children: [
                        Icon(
                          module.icon != null
                              ? Formatters.getIconData(module.icon!)
                              : Icons.folder,
                          color: moduleColor != null
                              ? Colors.white
                              : theme.colorScheme.onPrimaryContainer,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            module.title,
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: moduleColor != null
                                  ? Colors.white
                                  : theme.colorScheme.onPrimaryContainer,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Note count badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: moduleColor != null
                          ? Colors.white.withOpacity(0.3)
                          : theme.colorScheme.onPrimaryContainer.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${module.noteCount} note${module.noteCount != 1 ? 's' : ''}',
                      style: TextStyle(
                        fontSize: 12,
                        color: moduleColor != null
                            ? Colors.white
                            : theme.colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Module description and actions
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Description
                  if (module.description != null && module.description!.isNotEmpty) ...[
                    Text(
                      module.description!,
                      style: theme.textTheme.bodyMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                  ],
                  
                  // Module info - created/updated dates
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Created: ${Formatters.formatDate(module.createdAt)}',
                        style: theme.textTheme.bodySmall,
                      ),
                      Text(
                        'Updated: ${Formatters.formatDate(module.updatedAt)}',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                  
                  // Actions if available
                  if (onEditTap != null || onDeleteTap != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (onEditTap != null)
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: onEditTap,
                            tooltip: 'Edit',
                            constraints: const BoxConstraints(),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                        if (onDeleteTap != null) ...[
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.delete),
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}