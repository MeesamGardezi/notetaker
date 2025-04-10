/**
 * Media Uploader
 * Handles file uploads and media management for notes
 */

const mediaUploaderService = (() => {
    let noteId = null;
    
    /**
     * Initialize the media uploader
     * @param {string} _noteId - ID of the note
     */
    const init = (_noteId) => {
      noteId = _noteId;
      
      if (!noteId) {
        console.error('Note ID is required for media uploader');
        return;
      }
      
      // Set up upload button
      const uploadBtn = document.getElementById('upload-media-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', showUploadDialog);
      }
      
      // Set up upload form
      const uploadForm = document.getElementById('media-upload-form');
      if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
      }
      
      // Set up file input
      const fileInput = document.getElementById('media-file');
      if (fileInput) {
        fileInput.addEventListener('change', () => {
          const uploadBtn = document.getElementById('upload-media-btn');
          if (uploadBtn) {
            uploadBtn.disabled = !fileInput.files.length;
          }
        });
      }
    };
    
    /**
     * Show upload dialog
     */
    const showUploadDialog = () => {
      const modal = document.getElementById('media-upload-modal');
      if (modal) {
        // Reset form
        const form = document.getElementById('media-upload-form');
        if (form) {
          form.reset();
        }
        
        // Set note ID
        const noteIdInput = document.getElementById('media-note-id');
        if (noteIdInput) {
          noteIdInput.value = noteId;
        }
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
    };
    
    /**
     * Handle file upload
     * @param {Event} event - Form submit event
     */
    const handleUpload = async (event) => {
      event.preventDefault();
      
      const fileInput = document.getElementById('media-file');
      const uploadBtn = document.getElementById('upload-media-btn');
      const progressContainer = document.getElementById('upload-progress-container');
      const progressBar = document.getElementById('upload-progress-bar');
      
      if (!fileInput || !fileInput.files.length) {
        showToast('Please select a file to upload', 'warning');
        return;
      }
      
      try {
        // Show progress bar
        if (progressContainer) {
          progressContainer.classList.remove('d-none');
        }
        
        // Disable button
        if (uploadBtn) {
          uploadBtn.disabled = true;
          uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('noteId', noteId);
        
        // Upload file
        const response = await apiService.uploadFile('/media/upload', formData, (percent) => {
          if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', percent);
          }
        });
        
        // Hide modal
        const modal = document.getElementById('media-upload-modal');
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal.hide();
        }
        
        // Show success message
        showToast('File uploaded successfully', 'success');
        
        // Refresh media list
        if (typeof refreshMediaList === 'function') {
          refreshMediaList();
        } else {
          // Reload page as fallback
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        showToast('Failed to upload file: ' + (error.message || 'Unknown error'), 'error');
      } finally {
        // Reset form and UI
        if (progressContainer) {
          progressContainer.classList.add('d-none');
        }
        
        if (uploadBtn) {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = 'Upload';
        }
      }
    };
    
    /**
     * Refresh media list
     */
    const refreshMediaList = async () => {
      try {
        if (!noteId) return;
        
        // Get media files for note
        const response = await apiService.get(`/media/note/${noteId}`);
        
        if (response.success && response.data) {
          // Update media count
          const mediaCount = document.getElementById('media-count');
          if (mediaCount) {
            mediaCount.textContent = `(${response.data.media.length})`;
          }
          
          // Update media items
          const mediaItems = document.getElementById('media-items');
          const emptyState = document.getElementById('empty-media-state');
          
          if (mediaItems) {
            // Clear current items
            mediaItems.innerHTML = '';
            
            if (!response.data.media.length) {
              // Show empty state
              if (emptyState) {
                emptyState.style.display = '';
              }
              return;
            }
            
            // Hide empty state
            if (emptyState) {
              emptyState.style.display = 'none';
            }
            
            // Add media items
            response.data.media.forEach(file => {
              addMediaItem(mediaItems, file);
            });
          }
        }
      } catch (error) {
        console.error('Error refreshing media list:', error);
        showToast('Failed to refresh media list', 'error');
      }
    };
    
    /**
     * Add media item to container
     * @param {HTMLElement} container - Container element
     * @param {Object} file - Media file data
     */
    const addMediaItem = (container, file) => {
      const template = document.getElementById('media-item-template');
      
      if (!template) {
        console.error('Media item template not found');
        return;
      }
      
      const item = document.importNode(template.content, true).firstElementChild;
      
      // Set file data
      item.dataset.mediaId = file.id;
      
      // Set file name
      const nameElement = item.querySelector('.media-item-name');
      if (nameElement) {
        nameElement.textContent = file.originalFilename || file.filename;
      }
      
      // Set file info
      const sizeElement = item.querySelector('.media-size');
      const typeElement = item.querySelector('.media-type');
      
      if (sizeElement) {
        sizeElement.textContent = formatFileSize(file.size);
      }
      
      if (typeElement) {
        typeElement.textContent = getFileTypeLabel(file.mimeType);
      }
      
      // Set preview
      const previewElement = item.querySelector('.media-item-preview');
      
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
      const viewBtn = item.querySelector('.view-media-btn');
      const downloadBtn = item.querySelector('.download-media-btn');
      const deleteBtn = item.querySelector('.delete-media-btn');
      
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          showMediaPreview(file);
        });
      }
      
      if (downloadBtn) {
        downloadBtn.href = file.url;
        downloadBtn.download = file.originalFilename || file.filename;
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          confirmDeleteMedia(file.id);
        });
      }
      
      // Add to container
      container.appendChild(item);
    };
    
    /**
     * Show media preview
     * @param {Object} file - Media file data
     */
    const showMediaPreview = (file) => {
      const modal = document.getElementById('media-preview-modal');
      const title = document.getElementById('media-preview-title');
      const container = document.getElementById('media-preview-container');
      const downloadBtn = document.getElementById('media-download-btn');
      
      if (!modal || !container) {
        return;
      }
      
      // Set title
      if (title) {
        title.textContent = file.originalFilename || file.filename;
      }
      
      // Set download button
      if (downloadBtn) {
        downloadBtn.href = file.url;
        downloadBtn.download = file.originalFilename || file.filename;
      }
      
      // Set content
      if (file.mimeType && file.mimeType.startsWith('image/')) {
        // Image preview
        container.innerHTML = `<img src="${file.url}" alt="${file.originalFilename || file.filename}" style="max-width: 100%;">`;
      } else if (file.mimeType && file.mimeType.includes('pdf')) {
        // PDF preview
        container.innerHTML = `<iframe src="${file.url}" width="100%" height="500" frameborder="0"></iframe>`;
      } else {
        // Generic preview
        container.innerHTML = `
          <div class="text-center p-5">
            <i class="fas fa-file fa-4x mb-3"></i>
            <h4>${file.originalFilename || file.filename}</h4>
            <p class="mb-4">Preview not available. Please download the file to view it.</p>
          </div>
        `;
      }
      
      // Show modal
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    };
    
    /**
     * Confirm delete media
     * @param {string} mediaId - Media ID
     */
    const confirmDeleteMedia = (mediaId) => {
      if (confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
        deleteMedia(mediaId);
      }
    };
    
    /**
     * Delete media
     * @param {string} mediaId - Media ID
     */
    const deleteMedia = async (mediaId) => {
      try {
        // Delete media
        const response = await apiService.delete(`/media/${mediaId}?noteId=${noteId}`);
        
        if (response.success) {
          showToast('File deleted successfully', 'success');
          
          // Refresh media list
          refreshMediaList();
        } else {
          showToast(response.message || 'Failed to delete file', 'error');
        }
      } catch (error) {
        console.error('Error deleting media:', error);
        showToast('Failed to delete file', 'error');
      }
    };
    
    /**
     * Format file size
     * @param {number} bytes - File size in bytes
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
     * Get file type label
     * @param {string} mimeType - MIME type
     * @returns {string} - File type label
     */
    const getFileTypeLabel = (mimeType) => {
      if (!mimeType) return 'Unknown';
      
      const typeParts = mimeType.split('/');
      const mainType = typeParts[0];
      const subType = typeParts[1];
      
      // Handle image types
      if (mainType === 'image') {
        return subType.toUpperCase();
      }
      
      // Handle document types
      if (mimeType === 'application/pdf') {
        return 'PDF';
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        return 'Word';
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        return 'Excel';
      } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return 'PowerPoint';
      }
      
      // Default to main type
      return mainType.charAt(0).toUpperCase() + mainType.slice(1);
    };
    
    // Public API
    return {
      init,
      refreshMediaList
    };
  })();
  
  window.mediaUploaderService = mediaUploaderService;