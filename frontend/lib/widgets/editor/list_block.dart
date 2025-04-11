import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ListBlock extends StatefulWidget {
  final Map<String, dynamic> block;
  final bool isEditing;
  final bool isFocused;
  final VoidCallback onFocus;
  final Function(Map<String, dynamic>) onUpdate;
  final VoidCallback onEnter;
  final VoidCallback onDelete;
  
  const ListBlock({
    Key? key,
    required this.block,
    required this.isEditing,
    required this.isFocused,
    required this.onFocus,
    required this.onUpdate,
    required this.onEnter,
    required this.onDelete,
  }) : super(key: key);

  @override
  State<ListBlock> createState() => _ListBlockState();
}

class _ListBlockState extends State<ListBlock> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  late bool _isOrdered;
  late List<String> _listItems;
  
  @override
  void initState() {
    super.initState();
    
    // Get list type from metadata
    _isOrdered = (widget.block['metadata'] as Map<String, dynamic>?)?['ordered'] as bool? ?? false;
    
    // Parse list items from content
    _parseContent();
    
    // Initialize controller with full content
    _controller = TextEditingController(text: widget.block['content'] ?? '');
    _focusNode = FocusNode();
    
    // Set up listeners
    _controller.addListener(_handleTextChange);
    _focusNode.addListener(_handleFocusChange);
  }
  
  void _parseContent() {
    final content = widget.block['content'] as String? ?? '';
    _listItems = content.split('\n')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
    
    // Ensure at least one item
    if (_listItems.isEmpty) {
      _listItems = [''];
    }
  }
  
  @override
  void didUpdateWidget(ListBlock oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Update content if it changed from outside
    if (widget.block['content'] != _controller.text) {
      _controller.text = widget.block['content'] ?? '';
      _parseContent();
    }
    
    // Update list type if it changed from outside
    final newIsOrdered = (widget.block['metadata'] as Map<String, dynamic>?)?['ordered'] as bool? ?? false;
    if (newIsOrdered != _isOrdered) {
      setState(() {
        _isOrdered = newIsOrdered;
      });
    }
    
    // Request focus if needed
    if (widget.isFocused && !_focusNode.hasFocus && widget.isEditing) {
      _focusNode.requestFocus();
    }
  }
  
  void _handleTextChange() {
    // Only update if text actually changed
    if (_controller.text != widget.block['content']) {
      final updatedBlock = Map<String, dynamic>.from(widget.block);
      updatedBlock['content'] = _controller.text;
      
      // Update list items
      _parseContent();
      
      widget.onUpdate(updatedBlock);
    }
  }
  
  void _handleFocusChange() {
    if (_focusNode.hasFocus) {
      widget.onFocus();
    }
  }
  
  void _toggleListType() {
    setState(() {
      _isOrdered = !_isOrdered;
    });
    
    final updatedBlock = Map<String, dynamic>.from(widget.block);
    
    // Update or create metadata
    final metadata = (updatedBlock['metadata'] as Map<String, dynamic>?) ?? {};
    final updatedMetadata = Map<String, dynamic>.from(metadata);
    updatedMetadata['ordered'] = _isOrdered;
    updatedBlock['metadata'] = updatedMetadata;
    
    widget.onUpdate(updatedBlock);
  }
  
  void _handleKeyPress(RawKeyEvent event) {
    // Handle special key combinations
    if (event is RawKeyDownEvent) {
      // Enter key on empty last item creates a new block
      if (event.logicalKey.keyLabel == 'Enter') {
        // Check if we're on the last empty item
        final lastLineIndex = _controller.text.lastIndexOf('\n');
        final lastLine = lastLineIndex >= 0
            ? _controller.text.substring(lastLineIndex + 1)
            : _controller.text;
        
        if (lastLine.trim().isEmpty) {
          // Remove the last empty line
          if (lastLineIndex >= 0) {
            _controller.text = _controller.text.substring(0, lastLineIndex);
            _handleTextChange();
          } else {
            _controller.text = '';
            _handleTextChange();
          }
          
          // Create a new block
          widget.onEnter();
          return;
        }
        
        // Otherwise add a new line
        _controller.text += '\n';
        _controller.selection = TextSelection.fromPosition(
          TextPosition(offset: _controller.text.length),
        );
        return;
      }
      
      // Backspace on empty block deletes it
      if (event.logicalKey.keyLabel == 'Backspace' && _controller.text.isEmpty) {
        widget.onDelete();
        return;
      }
    }
  }
  
  @override
  void dispose() {
    _controller.removeListener(_handleTextChange);
    _focusNode.removeListener(_handleFocusChange);
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      decoration: BoxDecoration(
        color: widget.isFocused && widget.isEditing
            ? Theme.of(context).highlightColor
            : Colors.transparent,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // List type toggle (only in edit mode and when focused)
          if (widget.isEditing && widget.isFocused)
            _buildListTypeToggle(),
          
          // List content
          widget.isEditing
              ? _buildEditableList()
              : _buildReadOnlyList(),
        ],
      ),
    );
  }
  
  Widget _buildListTypeToggle() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ChoiceChip(
          label: const Text('Bulleted'),
          selected: !_isOrdered,
          onSelected: (_) => _toggleListType(),
          labelStyle: TextStyle(
            color: !_isOrdered
                ? Colors.white
                : Theme.of(context).textTheme.bodyLarge?.color,
          ),
          avatar: Icon(
            Icons.format_list_bulleted,
            size: 18,
            color: !_isOrdered
                ? Colors.white
                : Theme.of(context).textTheme.bodyLarge?.color,
          ),
        ),
        const SizedBox(width: 8),
        ChoiceChip(
          label: const Text('Numbered'),
          selected: _isOrdered,
          onSelected: (_) => _toggleListType(),
          labelStyle: TextStyle(
            color: _isOrdered
                ? Colors.white
                : Theme.of(context).textTheme.bodyLarge?.color,
          ),
          avatar: Icon(
            Icons.format_list_numbered,
            size: 18,
            color: _isOrdered
                ? Colors.white
                : Theme.of(context).textTheme.bodyLarge?.color,
          ),
        ),
      ],
    );
  }
  
  Widget _buildEditableList() {
    return RawKeyboardListener(
      focusNode: FocusNode(),
      onKey: _handleKeyPress,
      child: TextField(
        controller: _controller,
        focusNode: _focusNode,
        maxLines: null,
        decoration: InputDecoration(
          border: InputBorder.none,
          contentPadding: EdgeInsets.zero,
          isDense: true,
          hintText: _isOrdered
              ? '1. First item\n2. Second item'
              : '• First item\n• Second item',
        ),
        style: Theme.of(context).textTheme.bodyLarge,
        onTap: widget.onFocus,
      ),
    );
  }
  
  Widget _buildReadOnlyList() {
    if (_listItems.isEmpty || (_listItems.length == 1 && _listItems.first.isEmpty)) {
      return const SizedBox(height: 20);
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _listItems.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Bullet or number
              SizedBox(
                width: 24,
                child: _isOrdered
                    ? Text(
                        '${index + 1}.',
                        style: Theme.of(context).textTheme.bodyLarge,
                      )
                    : Text(
                        '•',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontSize: 20,
                        ),
                      ),
              ),
              
              // Item text
              Expanded(
                child: Text(
                  item,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}