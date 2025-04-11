import 'package:flutter/material.dart';
import '../../state/editor_state.dart';
import 'toolbar.dart';
import 'text_block.dart';
import 'heading_block.dart';
import 'list_block.dart';
import 'image_block.dart';
import 'block_menu.dart';
import 'drag_handle.dart';

class Editor extends StatefulWidget {
  final EditorState editorState;
  
  const Editor({
    Key? key,
    required this.editorState,
  }) : super(key: key);

  @override
  State<Editor> createState() => _EditorState();
}

class _EditorState extends State<Editor> {
  // Track currently focused block
  String? _focusedBlockId;
  
  // Scroll controller
  final ScrollController _scrollController = ScrollController();
  
  @override
  void initState() {
    super.initState();
    
    // Set up default blocks if empty
    _ensureContent();
  }
  
  void _ensureContent() {
    // Check if blocks are empty
    if (widget.editorState.blocks.value.isEmpty) {
      // Add a default text block
      widget.editorState.addBlock(
        widget.editorState.createEmptyTextBlock(),
      );
    }
  }
  
  // Handle block selection
  void _onBlockFocused(String blockId) {
    setState(() {
      _focusedBlockId = blockId;
    });
  }
  
  // Add a new block after the current block
  void _addBlockAfter(String blockId, String blockType) {
    // Find the index of the current block
    final index = widget.editorState.blocks.value.indexWhere((b) => b['id'] == blockId);
    
    if (index < 0) return;
    
    // Create new block based on type
    Map<String, dynamic> newBlock;
    
    switch (blockType) {
      case 'text':
        newBlock = widget.editorState.createEmptyTextBlock();
        break;
      case 'heading':
        newBlock = widget.editorState.createHeadingBlock('', level: 2);
        break;
      case 'list':
        newBlock = widget.editorState.createListBlock(['']);
        break;
      // Add other block types here
      default:
        newBlock = widget.editorState.createEmptyTextBlock();
    }
    
    // Add new block
    widget.editorState.addBlock(newBlock, atIndex: index + 1);
    
    // Focus the new block
    setState(() {
      _focusedBlockId = newBlock['id'];
    });
  }
  
  // Remove a block
  void _removeBlock(String blockId) {
    final blocks = widget.editorState.blocks.value;
    
    // Find the index of the block to remove
    final index = blocks.indexWhere((b) => b['id'] == blockId);
    
    if (index < 0) return;
    
    // Get the block before this one to focus after deletion
    final prevBlockId = index > 0 ? blocks[index - 1]['id'] : null;
    final nextBlockId = index < blocks.length - 1 ? blocks[index + 1]['id'] : null;
    
    // Remove the block
    widget.editorState.removeBlock(index);
    
    // Focus a nearby block or add a new one if this was the last block
    setState(() {
      if (prevBlockId != null) {
        _focusedBlockId = prevBlockId;
      } else if (nextBlockId != null) {
        _focusedBlockId = nextBlockId;
      } else {
        // Add a new block if we removed the last one
        _ensureContent();
        _focusedBlockId = widget.editorState.blocks.value.first['id'];
      }
    });
  }
  
  // Move blocks
  void _moveBlock(int oldIndex, int newIndex) {
    // Normalize newIndex (it gets confusing with removals)
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    
    widget.editorState.moveBlock(oldIndex, newIndex);
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Toolbar
        ValueListenableBuilder<bool>(
          valueListenable: widget.editorState.isEditing,
          builder: (context, isEditing, child) {
            return isEditing
                ? EditorToolbar(
                    editorState: widget.editorState,
                    focusedBlockId: _focusedBlockId,
                    onAddBlock: (blockType) {
                      if (_focusedBlockId != null) {
                        _addBlockAfter(_focusedBlockId!, blockType);
                      } else if (widget.editorState.blocks.value.isNotEmpty) {
                        _addBlockAfter(
                          widget.editorState.blocks.value.last['id'],
                          blockType,
                        );
                      }
                    },
                  )
                : const SizedBox.shrink();
          },
        ),
        
        // Content area
        Expanded(
          child: ValueListenableBuilder<List<Map<String, dynamic>>>(
            valueListenable: widget.editorState.blocks,
            builder: (context, blocks, child) {
              // Show placeholder when empty
              if (blocks.isEmpty) {
                return Center(
                  child: Text(
                    'Start typing to add content',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 16,
                    ),
                  ),
                );
              }
              
              return ValueListenableBuilder<bool>(
                valueListenable: widget.editorState.isEditing,
                builder: (context, isEditing, _) {
                  return ReorderableListView.builder(
                    scrollController: _scrollController,
                    itemCount: blocks.length,
                    onReorder: (int oldIndex, int newIndex) {
                      if (isEditing) _moveBlock(oldIndex, newIndex);
                    },
                    itemBuilder: (context, index) {
                      final block = blocks[index];
                      final blockId = block['id'] as String;
                      final blockType = block['type'] as String;
                      
                      // Determine if this block is focused
                      final isFocused = blockId == _focusedBlockId;
                      
                      // Build block based on type
                      Widget blockWidget;
                      
                      switch (blockType) {
                        case 'text':
                          blockWidget = TextBlock(
                            key: ValueKey(blockId),
                            block: block,
                            isEditing: isEditing,
                            isFocused: isFocused,
                            onFocus: () => _onBlockFocused(blockId),
                            onUpdate: (updatedBlock) {
                              widget.editorState.updateBlock(index, updatedBlock);
                            },
                            onEnter: () => _addBlockAfter(blockId, 'text'),
                            onDelete: () => _removeBlock(blockId),
                          );
                          break;
                          
                        case 'heading':
                          blockWidget = HeadingBlock(
                            key: ValueKey(blockId),
                            block: block,
                            isEditing: isEditing,
                            isFocused: isFocused,
                            onFocus: () => _onBlockFocused(blockId),
                            onUpdate: (updatedBlock) {
                              widget.editorState.updateBlock(index, updatedBlock);
                            },
                            onEnter: () => _addBlockAfter(blockId, 'text'),
                            onDelete: () => _removeBlock(blockId),
                          );
                          break;
                          
                        case 'list':
                          blockWidget = ListBlock(
                            key: ValueKey(blockId),
                            block: block,
                            isEditing: isEditing,
                            isFocused: isFocused,
                            onFocus: () => _onBlockFocused(blockId),
                            onUpdate: (updatedBlock) {
                              widget.editorState.updateBlock(index, updatedBlock);
                            },
                            onEnter: () => _addBlockAfter(blockId, 'text'),
                            onDelete: () => _removeBlock(blockId),
                          );
                          break;
                          
                        case 'image':
                          blockWidget = ImageBlock(
                            key: ValueKey(blockId),
                            block: block,
                            isEditing: isEditing,
                            isFocused: isFocused,
                            onFocus: () => _onBlockFocused(blockId),
                            onUpdate: (updatedBlock) {
                              widget.editorState.updateBlock(index, updatedBlock);
                            },
                            onDelete: () => _removeBlock(blockId),
                          );
                          break;
                          
                        default:
                          blockWidget = Container(
                            key: ValueKey(blockId),
                            padding: const EdgeInsets.all(16),
                            child: Text('Unknown block type: $blockType'),
                          );
                      }
                      
                      // Only add editing UI when in edit mode
                      if (!isEditing) {
                        return blockWidget;
                      }
                      
                      // When editing, add drag handle and block menu
                      return Row(
                        key: ValueKey(blockId),
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Drag handle
                          DragHandle(isFocused: isFocused),
                          
                          // Main content
                          Expanded(child: blockWidget),
                          
                          // Block menu for additional options
                          BlockMenu(
                            blockId: blockId,
                            blockType: blockType,
                            isFocused: isFocused,
                            onAddBlock: (type) => _addBlockAfter(blockId, type),
                            onRemoveBlock: () => _removeBlock(blockId),
                          ),
                        ],
                      );
                    },
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}