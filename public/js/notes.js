/**
 * Notes Management
 * Handles note-related functionality for the application
 */

const notesService = (() => {
    // Cache for notes by module ID
    const noteCache = {};
    
    // Cache for current note
    let currentNote = null;
    
    /**
     * Initialize the notes service
     */
    const init = () => {
      // Only initialize if user is authenticated
      if (!authService.getIsAuthenticated()) {
        return;
      }
      
      // Set up event handlers for notes UI
      setupEventHandlers();
      
      // Load notes if on a module or note page
      if (window.location.hash.startsWith('#modules/')) {
        const moduleId = window.location.hash.split('/')[1];
        if (moduleId) {
          getModuleNotes(moduleId);
        }
      } else if (window.location.hash.startsWith('#notes/')) {
        const noteId = window.location.hash.split('/')[1];
        if (noteId) {
          getNoteById(noteId).then(note => {
            // Store note in current note state
            currentNote = note;
            
            // Update note view if on note view page
            if (document.getElementById('note-view-page') || document.querySelector('.note-view-page')) {
              updateNoteView(note);
            }
          }).catch(error => {
            console.error('Failed to load note:', error);
            showToast('Failed to load note', 'error');
          });
        }
      }
    };
    
    /**
     * Set up event handlers for notes UI
     */
    const setupEventHandlers = () => {
      // New note button (on module page)
      const newNoteBtn = document.getElementById('new-note-btn');
      if (newNoteBtn) {
        newNoteBtn.addEventListener('click', () => {
          const moduleId = getCurrentModuleId();
          if (moduleId) {
            router.navigate('editor', { moduleId });
          }
        });
      }
      
      // Empty state create note button
      const emptyStateCreateBtn = document.getElementById('empty-state-create-btn');
      if (emptyStateCreateBtn) {
        emptyStateCreateBtn.addEventListener('click', () => {
          const moduleId = getCurrentModuleId();
          if (moduleId) {
            router.navigate('editor', { moduleId });
          }
        });
      }
      
      // New note quick action button (on dashboard)
      const newNoteAction = document.getElementById('new-note-action');
      if (newNoteAction) {
        newNoteAction.addEventListener('click', handleNewNoteAction);
      }
      
      // Edit note button (on note view page)
      const editNoteBtn = document.getElementById('edit-note-btn');
      if (editNoteBtn) {
        editNoteBtn.addEventListener('click', () => {
          if (currentNote) {
            router.navigate('editor', { moduleId: currentNote.moduleId, noteId: currentNote.id });
          }
        });
      }
      
      // Delete note button (on note view page)
      const deleteNoteBtn = document.getElementById('delete-note-btn');
      if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener('click', () => {
          if (currentNote) {
            confirmDeleteNote(currentNote.id);
          }
        });
      }
      
      // Export note button handlers
      document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          const format = e.currentTarget.dataset.format;
          if (currentNote && format) {
            exportNote(currentNote, format);
          }
        });
      });
      
      // Print note button
      const printNoteBtn = document.getElementById('print-note-btn');
      if (printNoteBtn) {
        printNoteBtn.addEventListener('click', () => {
          if (currentNote) {
            printNote(currentNote);
          }
        });
      }
      
      // Module notes view toggles
      const viewGridBtn = document.getElementById('view-grid-btn');
      const viewListBtn = document.getElementById('view-list-btn');
      
      if (viewGridBtn && viewListBtn) {
        viewGridBtn.addEventListener('click', () => {
          setNotesViewMode('grid');
        });
        
        viewListBtn.addEventListener('click', () => {
          setNotesViewMode('list');
        });
      }
      
      // Notes search input
      const notesSearchInput = document.getElementById('notes-search-input');
      if (notesSearchInput) {
        notesSearchInput.addEventListener('input', () => {
          const searchTerm = notesSearchInput.value.toLowerCase();
          filterNotes(searchTerm);
        });
      }
      
      // Sort options
      document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          const sortBy = e.currentTarget.dataset.sort;
          if (sortBy) {
            sortNotes(sortBy);
          }
        });
      });
      
      // Confirm delete button in confirmation modal
      const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
      if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
      }
      
      // Initialize notes sorting
      initNotesSorting();
    };
    
    /**
     * Get current module ID from URL
     * @returns {string|null} - Current module ID or null
     */
    const getCurrentModuleId = () => {
      if (window.location.hash.startsWith('#modules/')) {
        return window.location.hash.split('/')[1];
      }
      return null;
    };
    
    /**
     * Get current note ID from URL
     * @returns {string|null} - Current note ID or null
     */
    const getCurrentNoteId = () => {
      if (window.location.hash.startsWith('#notes/')) {
        return window.location.hash.split('/')[1];
      }
      return null;
    };
    
    /**
     * Initialize sorting functionality for notes
     */
    const initNotesSorting = () => {
      const notesGrid = document.getElementById('notes-grid');
      
      if (notesGrid && typeof Sortable !== 'undefined') {
        // Initialize Sortable
        const sortable = Sortable.create(notesGrid, {
          animation: 150,
          handle: '.note-card',
          onEnd: async (evt) => {
            try {
              const moduleId = getCurrentModuleId();
              if (!moduleId) return;
              
              // Get new order of notes
              const items = Array.from(notesGrid.querySelectorAll('.note-card'));
              const orderData = items.map((item, index) => ({
                id: item.dataset.noteId,
                position: index + 1
              }));
              
              // Update notes order via API
              await reorderNotes(moduleId, orderData);
            } catch (error) {
              console.error('Failed to update notes order:', error);
              showToast('Failed to save note order', 'error');
              
              // Refresh notes to reset order
              const moduleId = getCurrentModuleId();
              if (moduleId) {
                await getModuleNotes(moduleId);
              }
            }
          }
        });
      }
    };
    
    /**
     * Handle new note action
     * Show module selection dialog if multiple modules exist
     */
    const handleNewNoteAction = async () => {
      try {
        // Get available modules
        let modules;
        
        if (typeof modulesService !== 'undefined' && modulesService.getUserModules) {
          modules = await modulesService.getUserModules();
        } else {
          showToast('Cannot create note: Modules service not available', 'error');
          return;
        }
        
        if (!modules || modules.length === 0) {
          // No modules, prompt to create one first
          showToast('Please create a module first before adding notes', 'info');
          
          // If module creation function available, open create module modal
          if (typeof modulesService !== 'undefined' && modulesService.openCreateModuleModal) {
            modulesService.openCreateModuleModal();
          }
          
          return;
        }
        
        if (modules.length === 1) {
          // Only one module, navigate directly to editor
          router.navigate('editor', { moduleId: modules[0].id });
          return;
        }
        
        // Multiple modules, show selection dialog
        showModuleSelectionDialog(modules);
      } catch (error) {
        console.error('Failed to handle new note action:', error);
        showToast('Error creating new note', 'error');
      }
    };
    
    /**
     * Show module selection dialog for new note
     * @param {Array} modules - Available modules
     */
    const showModuleSelectionDialog = (modules) => {
      // Create modal dynamically
      const modalHTML = `
        <div class="modal fade" id="module-selection-modal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Select Module</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p>Select a module for your new note:</p>
                <div class="list-group">
                  ${modules.map(module => `
                    <button type="button" class="list-group-item list-group-item-action module-select-item" 
                            data-module-id="${module.id}">
                      <div class="d-flex align-items-center">
                        <div class="module-color me-3" style="background-color: ${module.color || '#3498db'};
                                                            width: 15px; height: 15px; border-radius: 50%;"></div>
                        <div>
                          <strong>${module.name || 'Untitled Module'}</strong>
                          <div class="small text-muted">${module.noteCount || 0} notes</div>
                        </div>
                      </div>
                    </button>
                  `).join('')}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Create modal element
      const modalElement = document.createElement('div');
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement);
      
      // Initialize the modal
      const modal = new bootstrap.Modal(document.getElementById('module-selection-modal'));
      modal.show();
      
      // Add event listeners to module items
      document.querySelectorAll('.module-select-item').forEach(item => {
        item.addEventListener('click', () => {
          const moduleId = item.dataset.moduleId;
          modal.hide();
          
          // Navigate to editor with selected module
          router.navigate('editor', { moduleId });
          
          // Clean up after modal is hidden
          document.getElementById('module-selection-modal').addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modalElement);
          });
        });
      });
      
      // Clean up if modal is dismissed
      document.getElementById('module-selection-modal').addEventListener('hidden.bs.modal', () => {
        if (document.body.contains(modalElement)) {
          document.body.removeChild(modalElement);
        }
      });
    };
    
    /**
     * Set notes view mode (grid or list)
     * @param {string} mode - View mode ('grid' or 'list')
     */
    const setNotesViewMode = (mode) => {
      const notesGrid = document.getElementById('notes-grid');
      const notesList = document.getElementById('notes-list');
      const viewGridBtn = document.getElementById('view-grid-btn');
      const viewListBtn = document.getElementById('view-list-btn');
      
      if (!notesGrid || !notesList || !viewGridBtn || !viewListBtn) {
        return;
      }
      
      if (mode === 'grid') {
        notesGrid.classList.remove('d-none');
        notesList.classList.add('d-none');
        viewGridBtn.classList.add('active');
        viewListBtn.classList.remove('active');
        
        // Save preference
        localStorage.setItem('notes-view-mode', 'grid');
      } else if (mode === 'list') {
        notesGrid.classList.add('d-none');
        notesList.classList.remove('d-none');
        viewGridBtn.classList.remove('active');
        viewListBtn.classList.add('active');
        
        // Save preference
        localStorage.setItem('notes-view-mode', 'list');
      }
    };
    
    /**
     * Filter notes by search term
     * @param {string} searchTerm - Search term to filter by
     */
    const filterNotes = (searchTerm) => {
      if (!searchTerm) {
        // Clear filter
        document.querySelectorAll('.note-card, .note-row').forEach(item => {
          item.style.display = '';
        });
        return;
      }
      
      // Filter note cards in grid view
      document.querySelectorAll('.note-card').forEach(card => {
        const titleElement = card.querySelector('.note-title');
        const previewElement = card.querySelector('.note-preview');
        
        if (!titleElement) return;
        
        const title = titleElement.textContent.toLowerCase();
        const preview = previewElement ? previewElement.textContent.toLowerCase() : '';
        
        if (title.includes(searchTerm) || preview.includes(searchTerm)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
      
      // Filter note rows in list view
      document.querySelectorAll('.note-row').forEach(row => {
        const titleElement = row.querySelector('.note-title-link');
        
        if (!titleElement) return;
        
        const title = titleElement.textContent.toLowerCase();
        
        if (title.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
      
      // Show/hide empty state
      const notesGrid = document.getElementById('notes-grid');
      const notesList = document.getElementById('notes-list');
      const emptyState = document.getElementById('empty-notes-state');
      
      if (notesGrid && notesList && emptyState) {
        const visibleCards = Array.from(notesGrid.querySelectorAll('.note-card')).filter(card => card.style.display !== 'none');
        const visibleRows = Array.from(notesList.querySelectorAll('.note-row')).filter(row => row.style.display !== 'none');
        
        if (visibleCards.length === 0 && visibleRows.length === 0) {
          emptyState.classList.remove('d-none');
          emptyState.querySelector('h3').textContent = 'No matching notes';
          emptyState.querySelector('p').textContent = `No notes found matching "${searchTerm}"`;
        } else {
          emptyState.classList.add('d-none');
        }
      }
    };
    
    /**
     * Sort notes by specified criteria
     * @param {string} sortBy - Sort criteria
     */
    const sortNotes = (sortBy) => {
      const notesGrid = document.getElementById('notes-grid');
      const notesTableBody = document.getElementById('notes-table-body');
      
      if (!notesGrid || !notesTableBody) {
        return;
      }
      
      // Get notes from the grid
      const noteCards = Array.from(notesGrid.querySelectorAll('.note-card'));
      const noteRows = Array.from(notesTableBody.querySelectorAll('.note-row'));
      
      if (noteCards.length === 0 || noteRows.length === 0) {
        return;
      }
      
      // Sort function based on criteria
      let sortFunction;
      
      switch (sortBy) {
        case 'position':
          // Sort by original position (data attribute)
          sortFunction = (a, b) => {
            const posA = parseInt(a.dataset.position || '0', 10);
            const posB = parseInt(b.dataset.position || '0', 10);
            return posA - posB;
          };
          break;
        
        case 'title-asc':
          // Sort by title (A-Z)
          sortFunction = (a, b) => {
            const titleA = a.querySelector('.note-title, .note-title-link')?.textContent || '';
            const titleB = b.querySelector('.note-title, .note-title-link')?.textContent || '';
            return titleA.localeCompare(titleB);
          };
          break;
        
        case 'title-desc':
          // Sort by title (Z-A)
          sortFunction = (a, b) => {
            const titleA = a.querySelector('.note-title, .note-title-link')?.textContent || '';
            const titleB = b.querySelector('.note-title, .note-title-link')?.textContent || '';
            return titleB.localeCompare(titleA);
          };
          break;
        
        case 'date-newest':
          // Sort by date (newest first)
          sortFunction = (a, b) => {
            const dateA = new Date(a.dataset.updatedAt || 0);
            const dateB = new Date(b.dataset.updatedAt || 0);
            return dateB - dateA;
          };
          break;
        
        case 'date-oldest':
          // Sort by date (oldest first)
          sortFunction = (a, b) => {
            const dateA = new Date(a.dataset.updatedAt || 0);
            const dateB = new Date(b.dataset.updatedAt || 0);
            return dateA - dateB;
          };
          break;
        
        default:
          return;
      }
      
      // Sort note cards
      const sortedCards = noteCards.sort(sortFunction);
      
      // Re-append in sorted order (grid view)
      sortedCards.forEach(card => {
        notesGrid.appendChild(card);
      });
      
      // Sort note rows
      const sortedRows = noteRows.sort(sortFunction);
      
      // Re-append in sorted order (list view)
      sortedRows.forEach(row => {
        notesTableBody.appendChild(row);
      });
      
      // Save sort preference
      localStorage.setItem('notes-sort', sortBy);
    };
    
    /**
     * Confirm delete note
     * @param {string} noteId - ID of the note to delete
     */
    const confirmDeleteNote = async (noteId) => {
      try {
        // Get note data
        const note = await getNoteById(noteId);
        
        if (!note) {
          showToast('Note not found', 'error');
          return;
        }
        
        // Set confirmation message
        const confirmationMessage = document.getElementById('delete-confirmation-message');
        if (confirmationMessage) {
          confirmationMessage.innerHTML = `
            Are you sure you want to delete the note <strong>${note.title || 'Untitled Note'}</strong>?
            <br><br>
            This will permanently delete the note and all its attachments. This action cannot be undone.
          `;
        }
        
        // Store note ID for deletion
        const confirmButton = document.getElementById('confirm-delete-btn');
        if (confirmButton) {
          confirmButton.dataset.deleteType = 'note';
          confirmButton.dataset.deleteId = noteId;
        }
        
        // Show confirmation modal
        const confirmModal = document.getElementById('confirm-delete-modal');
        if (confirmModal) {
          const bsModal = new bootstrap.Modal(confirmModal);
          bsModal.show();
        }
      } catch (error) {
        console.error('Failed to prepare delete confirmation:', error);
        showToast('Failed to prepare delete confirmation', 'error');
      }
    };
    
    /**
     * Handle confirm delete button click
     */
    const handleConfirmDelete = async () => {
      // Get delete details
      const confirmButton = document.getElementById('confirm-delete-btn');
      
      if (!confirmButton) {
        return;
      }
      
      const deleteType = confirmButton.dataset.deleteType;
      const deleteId = confirmButton.dataset.deleteId;
      
      if (deleteType !== 'note' || !deleteId) {
        return;
      }
      
      try {
        // Show loading state
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        
        // Delete note
        const response = await apiService.delete(`/notes/${deleteId}`);
        
        // Hide modal
        const confirmModal = document.getElementById('confirm-delete-modal');
        if (confirmModal) {
          const bsModal = bootstrap.Modal.getInstance(confirmModal);
          bsModal.hide();
        }
        
        // Reset button state
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Delete';
        
        if (response.success) {
          showToast('Note deleted successfully', 'success');
          
          // Check if on the deleted note's page
          if (deleteId === getCurrentNoteId()) {
            // Navigate back to the module
            if (currentNote && currentNote.moduleId) {
              router.navigate('modules', { path: [currentNote.moduleId] });
            } else {
              router.navigate('dashboard');
            }
          } else {
            // Refresh notes list if on module page
            const moduleId = getCurrentModuleId();
            if (moduleId) {
              await getModuleNotes(moduleId);
            }
          }
        } else {
          showToast(response.message || 'Failed to delete note', 'error');
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
        
        // Hide modal
        const confirmModal = document.getElementById('confirm-delete-modal');
        if (confirmModal) {
          const bsModal = bootstrap.Modal.getInstance(confirmModal);
          bsModal.hide();
        }
        
        // Reset button state
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Delete';
        
        showToast('Failed to delete note', 'error');
      }
    };
    
    /**
     * Update note view with note data
     * @param {Object} note - Note data
     */
    const updateNoteView = (note) => {
      if (!note) return;
      
      // Update title
      const noteTitle = document.getElementById('note-title');
      const noteBreadcrumbTitle = document.getElementById('note-breadcrumb-title');
      
      if (noteTitle) {
        noteTitle.textContent = note.title || 'Untitled Note';
      }
      
      if (noteBreadcrumbTitle) {
        noteBreadcrumbTitle.textContent = note.title || 'Untitled Note';
      }
      
      // Update dates
      const createdDate = document.getElementById('note-created-date');
      const updatedDate = document.getElementById('note-updated-date');
      
      if (createdDate && note.createdAt) {
        createdDate.textContent = formatDate(note.createdAt);
      }
      
      if (updatedDate && note.updatedAt) {
        updatedDate.textContent = formatDate(note.updatedAt);
      }
      
      // Update module link
      const moduleLink = document.getElementById('module-link');
      
      if (moduleLink && note.moduleId) {
        moduleLink.href = `#modules/${note.moduleId}`;
        
        // Get module name
        if (note.moduleName) {
          moduleLink.textContent = note.moduleName;
        } else if (typeof modulesService !== 'undefined' && modulesService.getModuleById) {
          modulesService.getModuleById(note.moduleId)
            .then(module => {
              if (module) {
                moduleLink.textContent = module.name || 'Untitled Module';
              }
            })
            .catch(error => {
              console.error('Failed to get module for note:', error);
            });
        }
      }
      
      // Update note content
      const noteBody = document.getElementById('note-body');
      
      if (noteBody && note.content) {
        // Check if content is HTML
        if (note.content.trim().startsWith('<') && note.content.trim().endsWith('>')) {
          noteBody.innerHTML = note.content;
        } else {
          // Assume plain text
          noteBody.textContent = note.content;
        }
      }
      
      // Update media attachments
      updateMediaAttachments(note);
    };
    
    /**
     * Update media attachments display
     * @param {Object} note - Note data
     */
    const updateMediaAttachments = (note) => {
      const mediaCount = document.getElementById('media-count');
      const mediaItems = document.getElementById('media-items');
      const emptyMediaState = document.getElementById('empty-media-state');
      
      if (!mediaCount || !mediaItems || !emptyMediaState) {
        return;
      }
      
      // Update media count
      const count = note.mediaFiles ? note.mediaFiles.length : 0;
      mediaCount.textContent = `(${count})`;
      
      // Clear current media items
      mediaItems.innerHTML = '';
      
      // Show empty state or media items
      if (!note.mediaFiles || note.mediaFiles.length === 0) {
        emptyMediaState.style.display = '';
        return;
      } else {
        emptyMediaState.style.display = 'none';
      }
      
      // Get template
      const mediaItemTemplate = document.getElementById('media-item-template');
      
      if (!mediaItemTemplate) {
        return;
      }
      
      // Add each media file
      note.mediaFiles.forEach(file => {
        const mediaItem = document.importNode(mediaItemTemplate.content, true).firstElementChild;
        
        mediaItem.dataset.mediaId = file.id;
        
        // Set file name
        const nameElement = mediaItem.querySelector('.media-item-name');
        if (nameElement) {
          nameElement.textContent = file.originalFilename || file.filename;
        }
        
        // Set file size and type
        const sizeElement = mediaItem.querySelector('.media-size');
        const typeElement = mediaItem.querySelector('.media-type');
        
        if (sizeElement) {
          sizeElement.textContent = formatFileSize(file.size);
        }
        
        if (typeElement) {
          typeElement.textContent = getFileTypeLabel(file.mimeType);
        }
        
        // Set preview
        const previewElement = mediaItem.querySelector('.media-item-preview');
        
        if (previewElement) {
          // Set preview based on file type
          if (file.mimeType && file.mimeType.startsWith('image/')) {
            // Image preview
            previewElement.innerHTML = `<img src="${file.url}" alt="${file.originalFilename}" style="max-height: 100%; max-width: 100%;">`;
          } else {
            // Icon based on file type
            let icon = 'fas fa-file';
            
            if (file.mimeType) {
              if (file.mimeType.includes('pdf')) {
                icon = 'fas fa-file-pdf';
              } else if (file.mimeType.includes('word') || file.mimeType.includes('document')) {
                icon = 'fas fa-file-word';
              } else if (file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet')) {
                icon = 'fas fa-file-excel';
              } else if (file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation')) {
                icon = 'fas fa-file-powerpoint';
              } else if (file.mimeType.includes('text')) {
                icon = 'fas fa-file-alt';
              } else if (file.mimeType.includes('zip') || file.mimeType.includes('archive')) {
                icon = 'fas fa-file-archive';
              } else if (file.mimeType.includes('audio')) {
                icon = 'fas fa-file-audio';
              } else if (file.mimeType.includes('video')) {
                icon = 'fas fa-file-video';
              } else if (file.mimeType.includes('code') || file.mimeType.includes('javascript') || file.mimeType.includes('html')) {
                icon = 'fas fa-file-code';
              }
            }
            
            previewElement.innerHTML = `<i class="${icon}"></i>`;
          }
        }
        
        // Set action buttons
        const viewBtn = mediaItem.querySelector('.view-media-btn');
        const downloadBtn = mediaItem.querySelector('.download-media-btn');
        const deleteBtn = mediaItem.querySelector('.delete-media-btn');
        
        if (viewBtn) {
          viewBtn.addEventListener('click', () => viewMedia(file));
        }
        
        if (downloadBtn) {
          downloadBtn.href = file.url;
          downloadBtn.download = file.originalFilename || file.filename;
        }
        
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => confirmDeleteMedia(file.id, note.id));
        }
        
        // Add to container
        mediaItems.appendChild(mediaItem);
      });
    };
    
    /**
     * View media file in preview modal
     * @param {Object} file - Media file data
     */
    const viewMedia = (file) => {
      const previewModal = document.getElementById('media-preview-modal');
      const previewContainer = document.getElementById('media-preview-container');
      const previewTitle = document.getElementById('media-preview-title');
      const downloadBtn = document.getElementById('media-download-btn');
      
      if (!previewModal || !previewContainer || !previewTitle || !downloadBtn) {
        return;
      }
      
      // Set title
      previewTitle.textContent = file.originalFilename || file.filename;
      
      // Set download button
      downloadBtn.href = file.url;
      downloadBtn.download = file.originalFilename || file.filename;
      
      // Set preview content
      if (file.mimeType && file.mimeType.startsWith('image/')) {
        // Image preview
        previewContainer.innerHTML = `
          <img src="${file.url}" alt="${file.originalFilename || file.filename}" style="max-width: 100%;">
        `;
      } else if (file.mimeType && file.mimeType.includes('pdf')) {
        // PDF preview (if supported by browser)
        previewContainer.innerHTML = `
          <iframe src="${file.url}" width="100%" height="500" frameborder="0"></iframe>
        `;
      } else {
        // Default preview with download prompt
        previewContainer.innerHTML = `
          <div class="text-center p-5">
            <i class="fas fa-file fa-4x mb-3"></i>
            <h4>${file.originalFilename || file.filename}</h4>
            <p class="mb-4">Preview not available. Please download the file to view it.</p>
            <a href="${file.url}" download="${file.originalFilename || file.filename}" class="btn btn-primary">
              <i class="fas fa-download me-2"></i> Download File
            </a>
          </div>
        `;
      }
      
      // Show modal
      const bsModal = new bootstrap.Modal(previewModal);
      bsModal.show();
    };
    
    /**
     * Confirm delete media file
     * @param {string} mediaId - Media file ID
     * @param {string} noteId - Note ID
     */
    const confirmDeleteMedia = (mediaId, noteId) => {
      const confirmModal = document.getElementById('confirm-delete-modal');
      const confirmationMessage = document.getElementById('delete-confirmation-message');
      const confirmButton = document.getElementById('confirm-delete-btn');
      
      if (!confirmModal || !confirmationMessage || !confirmButton) {
        return;
      }
      
      // Set confirmation message
      confirmationMessage.innerHTML = `
        Are you sure you want to delete this file?
        <br><br>
        This action cannot be undone.
      `;
      
      // Store media ID and note ID for deletion
      confirmButton.dataset.deleteType = 'media';
      confirmButton.dataset.deleteId = mediaId;
      confirmButton.dataset.noteId = noteId;
      
      // Set up event handler for deletion
      confirmButton.onclick = async () => {
        try {
          // Show loading state
          confirmButton.disabled = true;
          confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
          
          // Delete media file
          const response = await apiService.delete(`/media/${mediaId}?noteId=${noteId}`);
          
          // Hide modal
          const bsModal = bootstrap.Modal.getInstance(confirmModal);
          bsModal.hide();
          
          // Reset button state
          confirmButton.disabled = false;
          confirmButton.innerHTML = 'Delete';
          
          if (response.success) {
            showToast('File deleted successfully', 'success');
            
            // Refresh note view
            if (noteId === getCurrentNoteId()) {
              const updatedNote = await getNoteById(noteId, true);
              if (updatedNote) {
                currentNote = updatedNote;
                updateNoteView(updatedNote);
              }
            }
          } else {
            showToast(response.message || 'Failed to delete file', 'error');
          }
        } catch (error) {
          console.error('Failed to delete media file:', error);
          
          // Hide modal
          const bsModal = bootstrap.Modal.getInstance(confirmModal);
          bsModal.hide();
          
          // Reset button state
          confirmButton.disabled = false;
          confirmButton.innerHTML = 'Delete';
          
          showToast('Failed to delete file', 'error');
        }
      };
      
      // Show confirmation modal
      const bsModal = new bootstrap.Modal(confirmModal);
      bsModal.show();
    };
    
    /**
     * Export note to specified format
     * @param {Object} note - Note data
     * @param {string} format - Export format (pdf, html, markdown, plain)
     */
    const exportNote = (note, format) => {
      if (!note || !format) {
        return;
      }
      
      switch (format) {
        case 'pdf':
          exportToPdf(note);
          break;
        
        case 'html':
          exportToHtml(note);
          break;
        
        case 'markdown':
          exportToMarkdown(note);
          break;
        
        case 'plain':
          exportToPlainText(note);
          break;
        
        default:
          showToast(`Export format "${format}" not supported`, 'error');
      }
    };
    
    /**
     * Export note to PDF
     * @param {Object} note - Note data
     */
    const exportToPdf = (note) => {
      showToast('PDF export is a Pro feature', 'info');
      
      // Here you would check user's tier and implement PDF export
      // For now, we'll implement a basic print-to-PDF as a substitute
      printNote(note);
    };
    
    /**
     * Export note to HTML
     * @param {Object} note - Note data
     */
    const exportToHtml = (note) => {
      if (!note) return;
      
      // Create HTML content
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${note.title || 'Untitled Note'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 2em;
              max-width: 800px;
              margin: 0 auto;
              padding: 2em;
            }
            h1 {
              color: #3498db;
              border-bottom: 1px solid #eee;
              padding-bottom: 0.5em;
            }
            .meta {
              color: #7f8c8d;
              font-size: 0.9em;
              margin-bottom: 2em;
            }
            .content {
              margin-top: 2em;
            }
          </style>
        </head>
        <body>
          <h1>${note.title || 'Untitled Note'}</h1>
          <div class="meta">
            <p>
              Created: ${formatDate(note.createdAt)}
              <br>
              Last Updated: ${formatDate(note.updatedAt)}
            </p>
          </div>
          <div class="content">
            ${note.content || ''}
          </div>
        </body>
        </html>
      `;
      
      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'note'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    /**
     * Export note to Markdown
     * @param {Object} note - Note data
     */
    const exportToMarkdown = (note) => {
      if (!note) return;
      
      // This is a simplified conversion - in a real app, you would use a proper HTML-to-Markdown converter
      let markdown = `# ${note.title || 'Untitled Note'}\n\n`;
      markdown += `Created: ${formatDate(note.createdAt)}  \n`;
      markdown += `Last Updated: ${formatDate(note.updatedAt)}\n\n`;
      
      // Convert HTML content to basic markdown (very simplified)
      let content = note.content || '';
      
      // This is a very basic conversion - would need a proper library in a real app
      content = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
        .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
        .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
        .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<hr[^>]*>/gi, '---\n')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
        .replace(/<[^>]*>/g, ''); // Remove any remaining tags
      
      markdown += content;
      
      // Create blob and download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'note'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    /**
     * Export note to plain text
     * @param {Object} note - Note data
     */
    const exportToPlainText = (note) => {
      if (!note) return;
      
      // Create plain text content
      let text = `${note.title || 'Untitled Note'}\n\n`;
      text += `Created: ${formatDate(note.createdAt)}\n`;
      text += `Last Updated: ${formatDate(note.updatedAt)}\n\n`;
      
      // Convert HTML content to plain text
      let content = note.content || '';
      
      // Simple HTML to text conversion
      content = content
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]*>/g, ''); // Remove any remaining tags
      
      text += content;
      
      // Create blob and download
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'note'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    /**
     * Print note
     * @param {Object} note - Note data
     */
    const printNote = (note) => {
      if (!note) return;
      
      // Create print window
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        showToast('Could not open print window. Please check your popup blocker settings.', 'error');
        return;
      }
      
      // Add content to print window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${note.title || 'Untitled Note'} - Print</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 2em;
            }
            h1 {
              color: #333;
              border-bottom: 1px solid #eee;
              padding-bottom: 0.5em;
            }
            .meta {
              color: #777;
              font-size: 0.9em;
              margin-bottom: 2em;
            }
            .content {
              margin-top: 2em;
            }
            @media print {
              body {
                margin: 1.5cm;
              }
            }
          </style>
        </head>
        <body>
          <h1>${note.title || 'Untitled Note'}</h1>
          <div class="meta">
            <p>
              Created: ${formatDate(note.createdAt)}
              <br>
              Last Updated: ${formatDate(note.updatedAt)}
            </p>
          </div>
          <div class="content">
            ${note.content || ''}
          </div>
          <script>
            // Print and close window
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `);
    };
    
    /**
     * Get notes for a module
     * @param {string} moduleId - Module ID
     * @param {boolean} [forceRefresh=false] - Whether to force refresh from API
     * @returns {Promise<Array>} - Array of notes
     */
    const getModuleNotes = async (moduleId, forceRefresh = false) => {
      if (!moduleId) {
        console.error('Module ID required to get notes');
        return [];
      }
      
      try {
        // Check cache first (unless force refresh)
        if (!forceRefresh && noteCache[moduleId]) {
          renderNotes(noteCache[moduleId], moduleId);
          return noteCache[moduleId];
        }
        
        // Get notes from API
        const response = await apiService.get(`/notes/module/${moduleId}`);
        
        if (response.success && response.data) {
          // Cache notes
          noteCache[moduleId] = response.data.notes;
          
          // Render notes
          renderNotes(response.data.notes, moduleId);
          
          return response.data.notes;
        } else {
          throw new Error(response.message || 'Failed to load notes');
        }
      } catch (error) {
        console.error(`Failed to get notes for module ${moduleId}:`, error);
        
        // Check if it's an auth error
        if (apiService.isAuthError(error)) {
          showToast('Your session has expired. Please log in again.', 'error');
          // Redirect to login after a slight delay
          setTimeout(() => {
            window.location.hash = '#login';
          }, 2000);
        } else {
          showToast('Failed to load notes', 'error');
        }
        
        // Clear cache for this module
        delete noteCache[moduleId];
        
        return [];
      }
    };
    
    /**
     * Render notes in the notes container
     * @param {Array} notes - Array of notes
     * @param {string} moduleId - Module ID
     */
    const renderNotes = (notes, moduleId) => {
      // Check if we're on the module view page
      const notesGrid = document.getElementById('notes-grid');
      const notesTableBody = document.getElementById('notes-table-body');
      const emptyState = document.getElementById('empty-notes-state');
      
      if (!notesGrid || !notesTableBody) {
        return;
      }
      
      // Clear current notes
      notesGrid.innerHTML = '';
      notesTableBody.innerHTML = '';
      
      // Show empty state if no notes
      if (!notes || notes.length === 0) {
        if (emptyState) {
          emptyState.classList.remove('d-none');
        }
        return;
      } else if (emptyState) {
        emptyState.classList.add('d-none');
      }
      
      // Get templates
      const cardTemplate = document.getElementById('note-card-template');
      const rowTemplate = document.getElementById('note-row-template');
      
      if (!cardTemplate || !rowTemplate) {
        console.error('Note templates not found');
        return;
      }
      
      // Sort notes by position
      const sortedNotes = [...notes].sort((a, b) => a.position - b.position);
      
      // Add each note to the grid and table
      sortedNotes.forEach((note, index) => {
        // Create card for grid view
        const noteCard = document.importNode(cardTemplate.content, true).firstElementChild;
        
        // Set data attributes
        noteCard.dataset.noteId = note.id;
        noteCard.dataset.position = note.position || index + 1;
        noteCard.dataset.updatedAt = note.updatedAt || '';
        
        // Set content
        const titleElement = noteCard.querySelector('.note-title');
        const previewElement = noteCard.querySelector('.note-preview');
        const dateElement = noteCard.querySelector('.note-date');
        const mediaCountElement = noteCard.querySelector('.note-media-count');
        const mediaCountValueElement = noteCard.querySelector('.media-count');
        const openButton = noteCard.querySelector('.open-note-btn');
        const editButton = noteCard.querySelector('.edit-note-btn');
        const deleteButton = noteCard.querySelector('.delete-note-btn');
        
        if (titleElement) {
          titleElement.textContent = note.title || 'Untitled Note';
        }
        
        if (previewElement) {
          // Create a simple plain text preview
          let preview = '';
          
          if (note.content) {
            // Strip HTML tags for preview
            preview = note.content.replace(/<[^>]*>/g, ' ');
            // Limit to ~100 characters
            if (preview.length > 100) {
              preview = preview.substring(0, 100) + '...';
            }
          }
          
          previewElement.textContent = preview || 'No content';
        }
        
        if (dateElement) {
          dateElement.textContent = note.updatedAt ? `Edited ${formatRelativeTime(note.updatedAt)}` : 'Just created';
        }
        
        if (mediaCountElement && mediaCountValueElement) {
          if (note.mediaFiles && note.mediaFiles.length > 0) {
            mediaCountElement.classList.remove('d-none');
            mediaCountValueElement.textContent = note.mediaFiles.length;
          } else {
            mediaCountElement.classList.add('d-none');
          }
        }
        
        if (openButton) {
          openButton.href = `#notes/${note.id}`;
        }
        
        if (editButton) {
          editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            router.navigate('editor', { moduleId, noteId: note.id });
          });
        }
        
        if (deleteButton) {
          deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteNote(note.id);
          });
        }
        
        // Add card to grid
        notesGrid.appendChild(noteCard);
        
        // Create row for list view
        const noteRow = document.importNode(rowTemplate.content, true).firstElementChild;
        
        // Set data attributes
        noteRow.dataset.noteId = note.id;
        noteRow.dataset.position = note.position || index + 1;
        noteRow.dataset.updatedAt = note.updatedAt || '';
        
        // Set content
        const titleLink = noteRow.querySelector('.note-title-link');
        const dateCell = noteRow.querySelector('.note-date-cell');
        const mediaCell = noteRow.querySelector('.note-media-cell');
        const rowMediaCount = noteRow.querySelector('.note-media-count');
        const rowMediaCountValue = noteRow.querySelector('.media-count');
        const rowOpenButton = noteRow.querySelector('.open-note-btn');
        const rowEditButton = noteRow.querySelector('.edit-note-btn');
        const rowDeleteButton = noteRow.querySelector('.delete-note-btn');
        
        if (titleLink) {
          titleLink.textContent = note.title || 'Untitled Note';
          titleLink.href = `#notes/${note.id}`;
        }
        
        if (dateCell) {
          dateCell.textContent = note.updatedAt ? formatRelativeTime(note.updatedAt) : 'Just created';
        }
        
        if (rowMediaCount && rowMediaCountValue) {
          if (note.mediaFiles && note.mediaFiles.length > 0) {
            rowMediaCount.classList.remove('d-none');
            rowMediaCountValue.textContent = note.mediaFiles.length;
          } else {
            rowMediaCount.classList.add('d-none');
          }
        }
        
        if (rowOpenButton) {
          rowOpenButton.addEventListener('click', () => {
            router.navigate('notes', { path: [note.id] });
          });
        }
        
        if (rowEditButton) {
          rowEditButton.addEventListener('click', () => {
            router.navigate('editor', { moduleId, noteId: note.id });
          });
        }
        
        if (rowDeleteButton) {
          rowDeleteButton.addEventListener('click', () => {
            confirmDeleteNote(note.id);
          });
        }
        
        // Add row to table
        notesTableBody.appendChild(noteRow);
      });
      
      // Restore view mode preference
      const savedViewMode = localStorage.getItem('notes-view-mode') || 'grid';
      setNotesViewMode(savedViewMode);
      
      // Restore sort preference
      const savedSortBy = localStorage.getItem('notes-sort');
      if (savedSortBy && savedSortBy !== 'position') {
        sortNotes(savedSortBy);
      }
    };
    
    /**
     * Get note by ID
     * @param {string} noteId - Note ID
     * @param {boolean} [forceRefresh=false] - Whether to force refresh from API
     * @returns {Promise<Object|null>} - Note data or null if not found
     */
    const getNoteById = async (noteId, forceRefresh = false) => {
      if (!noteId) {
        console.error('Note ID required');
        return null;
      }
      
      try {
        // Check if note is in current note
        if (!forceRefresh && currentNote && currentNote.id === noteId) {
          return currentNote;
        }
        
        // Check if note is in cache
        for (const moduleId in noteCache) {
          const cachedNote = noteCache[moduleId].find(note => note.id === noteId);
          if (cachedNote && !forceRefresh) {
            return cachedNote;
          }
        }
        
        // Get note from API
        const response = await apiService.get(`/notes/${noteId}`);
        
        if (response.success && response.data) {
          // Update note in cache if module is cached
          if (response.data.moduleId && noteCache[response.data.moduleId]) {
            const noteIndex = noteCache[response.data.moduleId].findIndex(note => note.id === noteId);
            
            if (noteIndex >= 0) {
              noteCache[response.data.moduleId][noteIndex] = response.data;
            } else {
              noteCache[response.data.moduleId].push(response.data);
            }
          }
          
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to load note');
        }
      } catch (error) {
        console.error(`Failed to get note ${noteId}:`, error);
        
        // Check if it's an auth error
        if (apiService.isAuthError(error)) {
          showToast('Your session has expired. Please log in again.', 'error');
          // Redirect to login after a slight delay
          setTimeout(() => {
            window.location.hash = '#login';
          }, 2000);
        } else {
          showToast('Failed to load note', 'error');
        }
        
        return null;
      }
    };
    
    /**
     * Reorder notes within a module
     * @param {string} moduleId - Module ID
     * @param {Array} orderData - Array of objects with id and position
     * @returns {Promise<boolean>} - Whether order was updated successfully
     */
    const reorderNotes = async (moduleId, orderData) => {
      if (!moduleId || !orderData || !Array.isArray(orderData) || orderData.length === 0) {
        return false;
      }
      
      try {
        const response = await apiService.put('/notes/reorder', {
          moduleId,
          order: orderData
        });
        
        if (response.success) {
          // Update cache with new positions
          if (noteCache[moduleId]) {
            orderData.forEach(item => {
              const cacheIndex = noteCache[moduleId].findIndex(note => note.id === item.id);
              
              if (cacheIndex >= 0) {
                noteCache[moduleId][cacheIndex].position = item.position;
              }
            });
          }
          
          return true;
        } else {
          throw new Error(response.message || 'Failed to update order');
        }
      } catch (error) {
        console.error(`Failed to reorder notes for module ${moduleId}:`, error);
        return false;
      }
    };
    
    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} - Formatted date
     */
    const formatDate = (date) => {
      if (!date) return '';
      
      try {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Date formatting error:', error);
        return '';
      }
    };
    
    /**
     * Format relative time for display
     * @param {string|Date} date - Date to format
     * @returns {string} - Formatted relative time
     */
    const formatRelativeTime = (date) => {
      if (!date) return '';
      
      try {
        const dateObj = new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) {
          return 'just now';
        } else if (diffMinutes < 60) {
          return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        } else if (diffHours < 24) {
          return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else if (diffDays < 7) {
          return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        } else {
          return formatDate(date);
        }
      } catch (error) {
        console.error('Relative time formatting error:', error);
        return '';
      }
    };
    
    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} - Formatted file size
     */
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    /**
     * Get human-readable file type label
     * @param {string} mimeType - MIME type
     * @returns {string} - File type label
     */
    const getFileTypeLabel = (mimeType) => {
      if (!mimeType) return 'Unknown';
      
      const typeParts = mimeType.split('/');
      const mainType = typeParts[0];
      const subType = typeParts[1];
      
      // Handle common types
      if (mainType === 'image') {
        return subType.toUpperCase();
      } else if (mimeType === 'application/pdf') {
        return 'PDF';
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        return 'Word';
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        return 'Excel';
      } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return 'PowerPoint';
      } else if (mainType === 'text') {
        return subType.toUpperCase();
      } else if (mimeType.includes('zip') || mimeType.includes('archive')) {
        return 'Archive';
      } else if (mainType === 'audio') {
        return 'Audio';
      } else if (mainType === 'video') {
        return 'Video';
      }
      
      // Default to upper-cased subtype
      return subType.charAt(0).toUpperCase() + subType.slice(1);
    };
    
    // Public API
    return {
      init,
      getModuleNotes,
      getNoteById,
      reorderNotes,
      getCurrentNote: () => currentNote
    };
  })();
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize notes service after authentication is ready
    if (typeof authService !== 'undefined') {
      authService.addAuthListener(state => {
        if (state.isAuthenticated) {
          notesService.init();
        }
      });
    } else {
      console.warn('Auth service not available, notes initialization may be delayed');
      
      // Try to initialize anyway after a delay
      setTimeout(() => {
        if (typeof authService !== 'undefined' && authService.getIsAuthenticated()) {
          notesService.init();
        }
      }, 1000);
    }
  });