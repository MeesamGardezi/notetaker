import 'package:flutter/material.dart';
import '../../state/editor_state.dart';

class EditorToolbar extends StatelessWidget {
  final EditorState editorState;
  final String? focusedBlockId;
  final Function(String) onAddBlock;
  
  const EditorToolbar({
    Key? key,
    required this.editorState,
    this.focusedBlockId,
    required this.onAddBlock,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor,
            width: 1,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Block type selector (placeholder)
          _buildBlockTypeButton(context, 'Text', Icons.text_fields, 'text'),
          _buildBlockTypeButton(context, 'Heading', Icons.title, 'heading'),
          _buildBlockTypeButton(context, 'List', Icons.format_list_bulleted, 'list'),
          _buildBlockTypeButton(context, 'Image', Icons.image, 'image'),
          
          const Spacer(),
          
          // Right-side formatting controls
          ValueListenableBuilder<bool>(
            valueListenable: editorState.isSaving,
            builder: (context, isSaving, child) {
              if (isSaving) {
                return const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  ),
                );
              }
              return ValueListenableBuilder<bool>(
                valueListenable: editorState.hasChanges,
                builder: (context, hasChanges, child) {
                  return AnimatedOpacity(
                    opacity: hasChanges ? 1.0 : 0.5,
                    duration: const Duration(milliseconds: 200),
                    child: TextButton.icon(
                      icon: const Icon(Icons.save),
                      label: const Text('Save'),
                      onPressed: hasChanges
                          ? () => editorState.saveChanges()
                          : null,
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
  
  Widget _buildBlockTypeButton(
    BuildContext context,
    String label,
    IconData icon,
    String blockType,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Tooltip(
        message: 'Add $label',
        child: IconButton(
          icon: Icon(icon),
          onPressed: () => onAddBlock(blockType),
        ),
      ),
    );
  }
}