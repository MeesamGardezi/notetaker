import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';

class ImageBlock extends StatefulWidget {
  final Map<String, dynamic> block;
  final bool isEditing;
  final bool isFocused;
  final VoidCallback onFocus;
  final Function(Map<String, dynamic>) onUpdate;
  final VoidCallback onDelete;
  
  const ImageBlock({
    Key? key,
    required this.block,
    required this.isEditing,
    required this.isFocused,
    required this.onFocus,
    required this.onUpdate,
    required this.onDelete,
  }) : super(key: key);

  @override
  State<ImageBlock> createState() => _ImageBlockState();
}

class _ImageBlockState extends State<ImageBlock> {
  late FocusNode _focusNode;
  late TextEditingController _captionController;
  
  String? _imageUrl;
  String? _caption;
  double _maxWidth = 600;
  bool _isLoading = false;
  String? _errorMessage;
  
  final ImagePicker _imagePicker = ImagePicker();
  
  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    
    // Get image data from block
    _imageUrl = (widget.block['metadata'] as Map<String, dynamic>?)?['imageUrl'] as String?;
    _caption = (widget.block['metadata'] as Map<String, dynamic>?)?['caption'] as String?;
    
    // Initialize caption controller
    _captionController = TextEditingController(text: _caption ?? '');
    
    // Set up listeners
    _focusNode.addListener(_handleFocusChange);
    _captionController.addListener(_handleCaptionChange);
  }
  
  @override
  void didUpdateWidget(ImageBlock oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Update from block if metadata changed
    final newImageUrl = (widget.block['metadata'] as Map<String, dynamic>?)?['imageUrl'] as String?;
    final newCaption = (widget.block['metadata'] as Map<String, dynamic>?)?['caption'] as String?;
    
    if (newImageUrl != _imageUrl) {
      setState(() {
        _imageUrl = newImageUrl;
      });
    }
    
    if (newCaption != _caption) {
      setState(() {
        _caption = newCaption;
      });
      
      if (newCaption != _captionController.text) {
        _captionController.text = newCaption ?? '';
      }
    }
    
    // Request focus if needed
    if (widget.isFocused && !_focusNode.hasFocus && widget.isEditing) {
      _focusNode.requestFocus();
    }
  }
  
  void _handleFocusChange() {
    if (_focusNode.hasFocus) {
      widget.onFocus();
    }
  }
  
  void _handleCaptionChange() {
    if (_captionController.text != _caption) {
      setState(() {
        _caption = _captionController.text;
      });
      
      _updateBlockMetadata();
    }
  }
  
  void _updateBlockMetadata() {
    final updatedBlock = Map<String, dynamic>.from(widget.block);
    
    // Update or create metadata
    final metadata = (updatedBlock['metadata'] as Map<String, dynamic>?) ?? {};
    final updatedMetadata = Map<String, dynamic>.from(metadata);
    
    if (_imageUrl != null) {
      updatedMetadata['imageUrl'] = _imageUrl;
    }
    
    updatedMetadata['caption'] = _caption;
    
    updatedBlock['metadata'] = updatedMetadata;
    
    // Update content for searchability
    if (_caption != null && _caption!.isNotEmpty) {
      updatedBlock['content'] = _caption;
    } else {
      updatedBlock['content'] = 'Image';
    }
    
    widget.onUpdate(updatedBlock);
  }
  
  Future<void> _pickImage() async {
    try {
      final pickedFile = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1200,
        maxHeight: 1200,
      );
      
      if (pickedFile == null) return;
      
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
      
      // This is a placeholder for actual image upload
      // In a real app, you would upload the image to your server/storage
      // and get back a URL
      await Future.delayed(const Duration(seconds: 1));
      
      // For now, we'll just use the local file path as a demonstration
      // In a real app, this should be a URL
      final imageUrl = 'file://${pickedFile.path}';
      
      setState(() {
        _imageUrl = imageUrl;
        _isLoading = false;
      });
      
      _updateBlockMetadata();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }
  
  void _removeImage() {
    setState(() {
      _imageUrl = null;
    });
    
    _updateBlockMetadata();
  }
  
  void _updateMaxWidth(double width) {
    setState(() {
      _maxWidth = width;
    });
  }
  
  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    _captionController.removeListener(_handleCaptionChange);
    _focusNode.dispose();
    _captionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onFocus,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        decoration: BoxDecoration(
          color: widget.isFocused && widget.isEditing
              ? Theme.of(context).highlightColor
              : Colors.transparent,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Image content
            if (_imageUrl == null && widget.isEditing)
              // Placeholder for adding an image
              _buildImagePlaceholder()
            else if (_imageUrl != null)
              // Actual image
              _buildImage(),
            
            // Error message
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _errorMessage!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                    fontSize: 12,
                  ),
                ),
              ),
            
            // Caption input (only in edit mode)
            if (widget.isEditing && _imageUrl != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: TextField(
                  controller: _captionController,
                  focusNode: _focusNode,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Add caption...',
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 2,
                ),
              )
            else if (_caption != null && _caption!.isNotEmpty)
              // Read-only caption
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _caption!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            
            // Image controls (only in edit mode and when focused)
            if (widget.isEditing && widget.isFocused && _imageUrl != null)
              _buildImageControls(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildImagePlaceholder() {
    return _isLoading
        ? const SizedBox(
            height: 200,
            child: Center(
              child: CircularProgressIndicator(),
            ),
          )
        : InkWell(
            onTap: _pickImage,
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.add_photo_alternate,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Click to add an image',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
  }
  
  Widget _buildImage() {
    Widget imageWidget;
    
    if (_imageUrl!.startsWith('file://')) {
      // Local file
      final file = File(_imageUrl!.replaceFirst('file://', ''));
      imageWidget = Image.file(
        file,
        fit: BoxFit.contain,
        width: _maxWidth,
      );
    } else {
      // Network image
      imageWidget = Image.network(
        _imageUrl!,
        fit: BoxFit.contain,
        width: _maxWidth,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return SizedBox(
            height: 200,
            child: Center(
              child: CircularProgressIndicator(
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded / 
                        loadingProgress.expectedTotalBytes!
                    : null,
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          return Container(
            height: 200,
            color: Colors.grey.shade200,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.broken_image,
                    size: 48,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Failed to load image',
                    style: TextStyle(
                      color: Colors.grey.shade700,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    }
    
    // Make image tappable in edit mode
    if (widget.isEditing) {
      return InkWell(
        onTap: _pickImage,
        child: imageWidget,
      );
    }
    
    return imageWidget;
  }
  
  Widget _buildImageControls() {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Size controls
          IconButton(
            icon: const Icon(Icons.zoom_out),
            tooltip: 'Decrease size',
            onPressed: () => _updateMaxWidth(_maxWidth * 0.9),
          ),
          IconButton(
            icon: const Icon(Icons.zoom_in),
            tooltip: 'Increase size',
            onPressed: () => _updateMaxWidth(_maxWidth * 1.1),
          ),
          const SizedBox(width: 16),
          
          // Replace image
          IconButton(
            icon: const Icon(Icons.image),
            tooltip: 'Replace image',
            onPressed: _pickImage,
          ),
          
          // Remove image
          IconButton(
            icon: const Icon(Icons.delete),
            tooltip: 'Remove image',
            onPressed: _removeImage,
            color: Theme.of(context).colorScheme.error,
          ),
        ],
      ),
    );
  }
}