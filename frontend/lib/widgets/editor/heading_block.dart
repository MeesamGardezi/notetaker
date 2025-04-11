import 'package:flutter/material.dart';

class HeadingBlock extends StatefulWidget {
  final Map<String, dynamic> block;
  final bool isEditing;
  final bool isFocused;
  final VoidCallback onFocus;
  final Function(Map<String, dynamic>) onUpdate;
  final VoidCallback onEnter;
  final VoidCallback onDelete;
  
  const HeadingBlock({
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
  State<HeadingBlock> createState() => _HeadingBlockState();
}

class _HeadingBlockState extends State<HeadingBlock> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  late int _headingLevel;
  
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.block['content'] ?? '');
    _focusNode = FocusNode();
    
    // Get heading level from metadata
    _headingLevel = (widget.block['metadata'] as Map<String, dynamic>?)?['level'] as int? ?? 1;
    
    // Set up listeners
    _controller.addListener(_handleTextChange);
    _focusNode.addListener(_handleFocusChange);
  }
  
  @override
  void didUpdateWidget(HeadingBlock oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Update content if it changed from outside
    if (widget.block['content'] != _controller.text) {
      _controller.text = widget.block['content'] ?? '';
    }
    
    // Update heading level if it changed from outside
    final newLevel = (widget.block['metadata'] as Map<String, dynamic>?)?['level'] as int? ?? 1;
    if (newLevel != _headingLevel) {
      setState(() {
        _headingLevel = newLevel;
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
      widget.onUpdate(updatedBlock);
    }
  }
  
  void _handleFocusChange() {
    if (_focusNode.hasFocus) {
      widget.onFocus();
    }
  }
  
  void _updateHeadingLevel(int level) {
    if (level == _headingLevel) return;
    
    setState(() {
      _headingLevel = level;
    });
    
    final updatedBlock = Map<String, dynamic>.from(widget.block);
    
    // Update or create metadata
    final metadata = (updatedBlock['metadata'] as Map<String, dynamic>?) ?? {};
    final updatedMetadata = Map<String, dynamic>.from(metadata);
    updatedMetadata['level'] = level;
    updatedBlock['metadata'] = updatedMetadata;
    
    widget.onUpdate(updatedBlock);
  }
  
  void _handleKeyPress(RawKeyEvent event) {
    // Handle special key combinations
    if (event is RawKeyDownEvent) {
      // Enter key creates a new block
      if (event.logicalKey.keyLabel == 'Enter') {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Level selector (only in edit mode and when focused)
          if (widget.isEditing && widget.isFocused)
            _buildLevelSelector(),
          
          // Heading text
          widget.isEditing
              ? _buildEditableHeading()
              : _buildReadOnlyHeading(),
        ],
      ),
    );
  }
  
  Widget _buildLevelSelector() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 1; i <= 3; i++)
          Padding(
            padding: const EdgeInsets.only(right: 8, bottom: 8),
            child: ChoiceChip(
              label: Text('H$i'),
              selected: _headingLevel == i,
              onSelected: (_) => _updateHeadingLevel(i),
              labelStyle: TextStyle(
                fontWeight: FontWeight.bold,
                color: _headingLevel == i
                    ? Colors.white
                    : Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
          ),
      ],
    );
  }
  
  Widget _buildEditableHeading() {
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
          hintText: 'Heading',
        ),
        style: _getHeadingStyle(),
        onTap: widget.onFocus,
      ),
    );
  }
  
  Widget _buildReadOnlyHeading() {
    final content = widget.block['content'] as String? ?? '';
    
    if (content.isEmpty) {
      return const SizedBox(height: 20);
    }
    
    return Text(
      content,
      style: _getHeadingStyle(),
    );
  }
  
  TextStyle? _getHeadingStyle() {
    final theme = Theme.of(context);
    
    switch (_headingLevel) {
      case 1:
        return theme.textTheme.headlineLarge?.copyWith(
          fontWeight: FontWeight.bold,
        );
      case 2:
        return theme.textTheme.headlineMedium?.copyWith(
          fontWeight: FontWeight.bold,
        );
      case 3:
        return theme.textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.bold,
        );
      default:
        return theme.textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.bold,
        );
    }
  }
}