import 'package:flutter/material.dart';

class BlockMenu extends StatelessWidget {
  final String blockId;
  final String blockType;
  final bool isFocused;
  final Function(String) onAddBlock;
  final VoidCallback onRemoveBlock;
  
  const BlockMenu({
    Key? key,
    required this.blockId,
    required this.blockType,
    required this.isFocused,
    required this.onAddBlock,
    required this.onRemoveBlock,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Only show when block is focused
    if (!isFocused) {
      return const SizedBox(width: 24);
    }
    
    return Column(
      children: [
        // More options button
        IconButton(
          icon: const Icon(Icons.more_vert, size: 18),
          visualDensity: VisualDensity.compact,
          onPressed: () {
            _showBlockOptions(context);
          },
        ),
      ],
    );
  }
  
  void _showBlockOptions(BuildContext context) {
    final RenderBox button = context.findRenderObject() as RenderBox;
    final RenderBox overlay = Navigator.of(context).overlay!.context.findRenderObject() as RenderBox;
    final RelativeRect position = RelativeRect.fromRect(
      Rect.fromPoints(
        button.localToGlobal(Offset.zero, ancestor: overlay),
        button.localToGlobal(button.size.bottomRight(Offset.zero), ancestor: overlay),
      ),
      Offset.zero & overlay.size,
    );
    
    showMenu<String>(
      context: context,
      position: position,
      items: [
        const PopupMenuItem<String>(
          value: 'text',
          child: Row(
            children: [
              Icon(Icons.text_fields),
              SizedBox(width: 8),
              Text('Add Text Block'),
            ],
          ),
        ),
        const PopupMenuItem<String>(
          value: 'heading',
          child: Row(
            children: [
              Icon(Icons.title),
              SizedBox(width: 8),
              Text('Add Heading'),
            ],
          ),
        ),
        const PopupMenuItem<String>(
          value: 'list',
          child: Row(
            children: [
              Icon(Icons.format_list_bulleted),
              SizedBox(width: 8),
              Text('Add List'),
            ],
          ),
        ),
        const PopupMenuItem<String>(
          value: 'image',
          child: Row(
            children: [
              Icon(Icons.image),
              SizedBox(width: 8),
              Text('Add Image'),
            ],
          ),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem<String>(
          value: 'delete',
          child: Row(
            children: [
              Icon(Icons.delete, color: Colors.red),
              SizedBox(width: 8),
              Text('Delete Block', style: TextStyle(color: Colors.red)),
            ],
          ),
        ),
      ],
      elevation: 8.0,
    ).then((value) {
      if (value == null) return;
      
      if (value == 'delete') {
        onRemoveBlock();
      } else {
        onAddBlock(value);
      }
    });
  }
}