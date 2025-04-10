// notetaker_frontend/lib/ui/notes/edit_note_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';

import '../../config/constants.dart';
import '../../models/module.dart';
import '../../models/note.dart';
import '../../models/user.dart';
import '../../notifiers/auth_notifier.dart';
import '../../notifiers/module_notifier.dart';
import '../../notifiers/note_notifier.dart';
import '../shared/styles.dart';
import '../shared/widgets/app_button.dart';
import '../shared/widgets/app_text_field.dart';
import '../shared/widgets/loading_indicator.dart';

class EditNoteScreen extends StatefulWidget {
  final String moduleId;
  final String? noteId;
  final AuthNotifier authNotifier;
  final ModuleNotifier moduleNotifier;
  final NoteNotifier noteNotifier;
  
  const EditNoteScreen({
    Key? key,
    required this.moduleId,
    this.noteId,
    required this.authNotifier,
    required this.moduleNotifier,
    required this.noteNotifier,
  }) : super(key: key);

  @override
  State<EditNoteScreen> createState() => _EditNoteScreenState();
}

class _EditNoteScreenState extends State<EditNoteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  late quill.QuillController _quillController;
  
  bool _isEditing = false;
  bool _isLoading = true;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _quillController = quill.QuillController.basic();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      // Load module if not already loaded
      await widget.moduleNotifier.selectModuleById(widget.moduleId);
      
      if (widget.noteId != null) {
        // Editing existing note
        await widget.noteNotifier.selectNoteById(widget.noteId!);
        final note = widget.noteNotifier.selectedNote.value;
        
        if (note != null) {
          _titleController.text = note.title;
          
          // Convert note content to Quill delta
          if (note.content.isNotEmpty) {
            try {
              // Try to parse as Quill JSON
              final contentJson = note.content;
              _quillController = quill.QuillController(
                document: quill.Document.fromJson(contentJson),
                selection: const TextSelection.collapsed(offset: 0),
              );
            } catch (e) {
              // If not valid Quill JSON, use as plain text
              _quillController = quill.QuillController(
                document: quill.Document.fromPlainText(note.content),
                selection: const TextSelection.collapsed(offset: 0),
              );
            }
          }
        }
        
        _isEditing = true;
      } else {
        // Creating new note
        _isEditing = false;
      }
    } catch (e) {
      _error = 'Failed to load note data: $e';
      print(_error);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  Future<void> _saveNote() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    
    final module = widget.moduleNotifier.selectedModule.value;
    final user = widget.authNotifier.currentUser.value;
    
    if (module == null || user == null) {
      setState(() {
        _error = 'Module or user data not found';
      });
      return;
    }
    
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final title = _titleController.text.trim();
      final content = _quillController.document.toJson();
      
      if (_isEditing && widget.noteId != null) {
        // Update existing note
        final note = widget.noteNotifier.selectedNote.value;
        if (note != null) {
          final updatedNote = note.copyWith(
            title: title,
            content: content,
            updatedAt: DateTime.now(),
          );
          
          final success = await widget.noteNotifier.updateNote(updatedNote);
          
          if (success && mounted) {
            context.go('${AppRoutes.modules}/${module.id}/notes/${note.id}');
          }
        }
      } else {
        // Create new note
        final canCreate = await _canCreateNote(user, module);
        
        if (!canCreate) {
          setState(() {
            _error = 'You have reached the maximum number of notes for this module';
          });
          return;
        }
        
        final note = await widget.noteNotifier.createNote(
          title,
          content,
          module.id,
          user.id,
        );
        
        if (note != null && mounted) {
          context.go('${AppRoutes.modules}/${module.id}/notes/${note.id}');
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to save note: $e';
      });
      print(_error);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  Future<bool> _canCreateNote(User user, Module module) async {
    // Check if user can create more notes in this module
    if (user.accountTier == 'pro') return true;
    return module.noteCount < user.noteLimit;
  }
  
  Future<void> _attachFile() async {
    final user = widget.authNotifier.currentUser.value;
    final note = widget.noteNotifier.selectedNote.value;
    
    if (user == null || (note == null && !_isEditing)) {
      setState(() {
        _error = 'Please save the note before attaching files';
      });
      return;
    }
    
    if (!_isEditing) {
      // Save note first if creating new
      await _saveNote();
    }
    
    final result = await FilePicker.platform.pickFiles();
    if (result == null || result.files.isEmpty) return;
    
    final file = File(result.files.first.path!);
    final fileSize = await file.length();
    
    // Check if file size is within limits
    if (fileSize > 10 * 1024 * 1024) { // 10MB
      if (mounted) {
        setState(() {
          _error = 'File too large. Maximum size is 10MB';
        });
      }
      return;
    }
    
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final currentNote = widget.noteNotifier.selectedNote.value;
      if (currentNote != null) {
        final media = await widget.noteNotifier.uploadMedia(
          file,
          user.id,
          currentNote.id,
        );
        
        if (media != null) {
          // Insert link to file in editor
          final fileLink = '[${media.originalFilename}](${media.url})';
          final index = _quillController.selection.baseOffset;
          final length = _quillController.selection.extentOffset - index;
          
          _quillController.replaceText(
            index,
            length,
            fileLink,
            null,
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to upload file: $e';
      });
      print(_error);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  @override
  void dispose() {
    _titleController.dispose();
    _quillController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? AppStrings.editNote : AppStrings.newNote),
        actions: [
          if (!_isLoading)
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: _saveNote,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: LoadingIndicator(message: AppStrings.loading))
          : _buildEditorContent(),
    );
  }
  
  Widget _buildEditorContent() {
    return ValueListenableBuilder<Module?>(
      valueListenable: widget.moduleNotifier.selectedModule,
      builder: (context, module, _) {
        if (module == null) {
          return const Center(child: Text('Module not found'));
        }
        
        return Form(
          key: _formKey,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(AppTheme.spacingM),
                child: AppTextField(
                  label: AppStrings.noteTitle,
                  hint: 'Enter note title',
                  controller: _titleController,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a title';
                    }
                    return null;
                  },
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: AppTheme.error),
                  ),
                ),
              const Divider(),
              quill.QuillToolbar.basic(
                controller: _quillController,
                showFontFamily: false,
                showFontSize: false,
                showBackgroundColorButton: false,
                showClearFormat: true,
                multiRowsDisplay: false,
              ),
              const Divider(),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingM),
                  child: quill.QuillEditor.basic(
                    controller: _quillController,
                    readOnly: false,
                  ),
                ),
              ),
              ValueListenableBuilder<Note?>(
                valueListenable: widget.noteNotifier.selectedNote,
                builder: (context, note, _) {
                  return Container(
                    padding: const EdgeInsets.all(AppTheme.spacingM),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: AppTheme.surfaceColor)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: AppButton(
                            label: AppStrings.save,
                            onPressed: _saveNote,
                            type: AppButtonType.primary,
                            fullWidth: true,
                          ),
                        ),
                        const SizedBox(width: AppTheme.spacingM),
                        IconButton(
                          onPressed: _attachFile,
                          icon: const Icon(Icons.attach_file),
                          tooltip: AppStrings.addAttachment,
                          color: module.color,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}