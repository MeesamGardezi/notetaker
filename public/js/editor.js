/**
 * Note Editor
 * Handles rich text editing functionality for notes
 */

const editorService = (() => {
    let quill = null;
    let currentNote = null;
    let moduleId = null;
    let noteId = null;
    let unsavedChanges = false;
  
    /**
     * Initialize the editor
     * @param {string} containerId - ID of the editor container
     * @param {string} _moduleId - ID of the module
     * @param {string} _noteId - ID of the note (null for new note)
     */
    const init = (containerId, _moduleId, _noteId = null) => {
      moduleId = _moduleId;
      noteId = _noteId;
      
      console.log('Initializing editor for module:', moduleId, 'note:', noteId);
      
      // Initialize Quill editor with toolbar options
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Editor container not found:', containerId);
        return;
      }
      
      // Basic toolbar options
      const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image']
      ];
      
      // Initialize editor
      quill = new Quill(container, {
        modules: {
          toolbar: toolbarOptions
        },
        placeholder: 'Start writing...',
        theme: 'snow'
      });
      
      // Set up event listeners
      quill.on('text-change', () => {
        unsavedChanges = true;
      });
      
      // Load note content if editing existing note
      if (noteId) {
        loadNoteContent();
      }
      
      // Set up save button
      const saveBtn = document.getElementById('save-note-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', saveNote);
      }
      
      // Set up cancel button
      const cancelBtn = document.getElementById('cancel-edit-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
      }
      
      // Handle unsaved changes
      window.addEventListener('beforeunload', (e) => {
        if (unsavedChanges) {
          e.preventDefault();
          e.returnValue = '';
          return '';
        }
      });
    };
  
    /**
     * Load note content into the editor
     */
    const loadNoteContent = async () => {
      try {
        // Use the notesService to get note by ID
        if (window.notesService && noteId) {
          const note = await window.notesService.getNoteById(noteId);
          
          if (note) {
            currentNote = note;
            
            // Set title
            const titleInput = document.getElementById('editor-title');
            if (titleInput) {
              titleInput.value = note.title || '';
            }
            
            // Set content
            if (quill) {
              if (note.content) {
                quill.root.innerHTML = note.content;
              } else {
                quill.root.innerHTML = '';
              }
              unsavedChanges = false;
            }
          }
        }
      } catch (error) {
        console.error('Error loading note content:', error);
        showToast('Failed to load note content', 'error');
      }
    };
  
    /**
     * Save the note
     */
    const saveNote = async () => {
      try {
        // Get note data
        const titleInput = document.getElementById('editor-title');
        const title = titleInput ? titleInput.value.trim() : 'Untitled Note';
        const content = quill.root.innerHTML;
        
        // Show loading state
        const saveBtn = document.getElementById('save-note-btn');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        // Save the note
        let result;
        
        if (noteId) {
          // Update existing note
          result = await apiService.put(`/notes/${noteId}`, {
            title,
            content
          });
        } else {
          // Create new note
          result = await apiService.post('/notes', {
            moduleId,
            title,
            content
          });
        }
        
        // Reset button state
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save';
        }
        
        if (result.success) {
          // Mark as saved
          unsavedChanges = false;
          
          // Show success message
          showToast('Note saved successfully', 'success');
          
          // Redirect to note view after short delay
          setTimeout(() => {
            const noteId = result.data.id || noteId;
            window.location.hash = `#notes/${noteId}`;
          }, 1000);
        } else {
          showToast(result.message || 'Failed to save note', 'error');
        }
      } catch (error) {
        console.error('Error saving note:', error);
        showToast('Failed to save note', 'error');
        
        // Reset button state
        const saveBtn = document.getElementById('save-note-btn');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save';
        }
      }
    };
  
    /**
     * Handle cancel button click
     */
    const handleCancel = () => {
      if (unsavedChanges) {
        // Show confirmation dialog
        const confirmDialog = document.getElementById('unsaved-changes-modal');
        if (confirmDialog) {
          const bsModal = new bootstrap.Modal(confirmDialog);
          bsModal.show();
          
          // Set up event handlers for dialog buttons
          const discardBtn = document.getElementById('discard-changes-btn');
          const saveBtn = document.getElementById('save-before-exit-btn');
          
          if (discardBtn) {
            discardBtn.onclick = () => {
              bsModal.hide();
              navigateAway();
            };
          }
          
          if (saveBtn) {
            saveBtn.onclick = async () => {
              bsModal.hide();
              await saveNote();
              navigateAway();
            };
          }
        } else {
          // No dialog available, ask with browser confirm
          if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
            navigateAway();
          }
        }
      } else {
        navigateAway();
      }
    };
  
    /**
     * Navigate away from the editor
     */
    const navigateAway = () => {
      if (noteId) {
        // Go to note view
        window.location.hash = `#notes/${noteId}`;
      } else if (moduleId) {
        // Go to module view
        window.location.hash = `#modules/${moduleId}`;
      } else {
        // Go to dashboard
        window.location.hash = '#dashboard';
      }
    };
  
    // Public API
    return {
      init,
      getEditor: () => quill
    };
  })();
  
  window.editorService = editorService;