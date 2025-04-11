import 'package:flutter/material.dart';

class TextBlock extends StatefulWidget {
  final Map<String, dynamic> block;
  final bool isEditing;
  final bool isFocused;
  final VoidCallback onFocus;
  final Function(Map<String, dynamic>) onUpdate;
  final VoidCallback onEnter;
  final VoidCallback onDelete;
  
  const TextBlock({
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
  State<TextBlock> createState() => _TextBlockState();
}

class _TextBlockState extends State<TextBlock> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.block['content'] ?? '');
    _focusNode = FocusNode();
    
    // Set up listeners
    _controller.addListener(_handleTextChange);
    _focusNode.addListener(_handleFocusChange);
  }
  
  @override
  void didUpdateWidget(TextBlock oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Update content if it changed from outside
    if (widget.block['content'] != _controller.text) {
      _controller.text = widget.block['content'] ?? '';
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
      widget.onUpdate(updatedBlock);
    }
  }
  
  void _handleFocusChange() {
    if (_focusNode.hasFocus) {
      widget.onFocus();
    }
  }
  
  void _handleKeyPress(RawKeyEvent event) {
    // Handle special key combinations
    if (event is RawKeyDownEvent) {
      // Enter key creates a new block
      if (event.logicalKey.keyLabel == 'Enter' && !event.isShiftPressed) {
        widget.onEnter();
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
      child: widget.isEditing
          ? _buildEditableText()
          : _buildReadOnlyText(),
    );
  }
  
  Widget _buildEditableText() {
    return RawKeyboardListener(
      focusNode: FocusNode(),
      onKey: _handleKeyPress,
      child: TextField(
        controller: _controller,
        focusNode: _focusNode,
        maxLines: null,
        decoration: const InputDecoration(
          border: InputBorder.none,
          contentPadding: EdgeInsets.zero,
          isDense: true,
          hintText: 'Start typing...',
        ),
        style: Theme.of(context).textTheme.bodyLarge,
        onTap: widget.onFocus,
      ),
    );
  }
  
  Widget _buildReadOnlyText() {
    final content = widget.block['content'] as String? ?? '';
    
    if (content.isEmpty) {
      return const SizedBox(height: 20);
    }
    
    return Text(
      content,
      style: Theme.of(context).textTheme.bodyLarge,
    );
  }
}