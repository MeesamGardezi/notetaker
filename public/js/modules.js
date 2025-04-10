/**
 * Modules Management
 * Handles module-related functionality for the application
 */

const modulesService = (() => {
    // Cache for modules
    let moduleCache = [];
    
    /**
     * Initialize the modules service
     * @returns {Promise<void>}
     */
    const init = async () => {
      // Only initialize if user is authenticated
      if (!authService.getIsAuthenticated()) {
        return;
      }
      
      // Set up event handlers for module management UI
      setupEventHandlers();
      
      // Load modules (only on dashboard page or module page)
      if (window.location.hash === '#dashboard' || 
          window.location.hash.startsWith('#modules/')) {
        try {
          await loadModules();
        } catch (error) {
          console.error('Failed to load modules:', error);
          showToast('Failed to load modules', 'error');
        }
      }
    };
    
    /**
     * Set up event handlers for module management
     */
    const setupEventHandlers = () => {
      // Add module button
      const addModuleButton = document.getElementById('add-module-button');
      if (addModuleButton) {
        addModuleButton.addEventListener('click', openCreateModuleModal);
      }
      
      // New module quick action
      const newModuleAction = document.getElementById('new-module-action');
      if (newModuleAction) {
        newModuleAction.addEventListener('click', openCreateModuleModal);
      }
      
      // Save module button in module modal
      const saveModuleBtn = document.getElementById('save-module-btn');
      if (saveModuleBtn) {
        saveModuleBtn.addEventListener('click', handleSaveModule);
      }
      
      // Module edit button (on module page)
      const editModuleBtn = document.getElementById('edit-module-btn');
      if (editModuleBtn) {
        editModuleBtn.addEventListener('click', () => {
          const moduleId = getCurrentModuleId();
          if (moduleId) {
            openEditModuleModal(moduleId);
          }
        });
      }
      
      // Module delete button (on module page)
      const deleteModuleBtn = document.getElementById('delete-module-btn');
      if (deleteModuleBtn) {
        deleteModuleBtn.addEventListener('click', () => {
          const moduleId = getCurrentModuleId();
          if (moduleId) {
            confirmDeleteModule(moduleId);
          }
        });
      }
      
      // Confirm delete button in confirmation modal
      const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
      if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
      }
      
      // Make modules list sortable if available
      initModulesSorting();
    };
    
    /**
     * Initialize sorting functionality for modules list
     */
    const initModulesSorting = () => {
      const modulesList = document.getElementById('modules-list');
      
      if (modulesList && typeof Sortable !== 'undefined') {
        // Initialize Sortable
        const sortable = Sortable.create(modulesList, {
          animation: 150,
          handle: '.module-item',
          onEnd: async (evt) => {
            try {
              // Get new order of modules
              const items = Array.from(modulesList.querySelectorAll('.module-item'));
              const orderData = items.map((item, index) => ({
                id: item.dataset.moduleId,
                position: index + 1
              }));
              
              // Update modules order via API
              await reorderModules(orderData);
            } catch (error) {
              console.error('Failed to update modules order:', error);
              showToast('Failed to save module order', 'error');
              
              // Refresh modules to reset order
              await loadModules();
            }
          }
        });
      }
    };
    
    /**
     * Load modules from API
     * @returns {Promise<Array>} - List of modules
     */
    const loadModules = async () => {
      try {
        const response = await apiService.get('/modules');
        
        if (response.success && response.data && response.data.modules) {
          // Update cache
          moduleCache = response.data.modules;
          
          // Render modules list
          renderModulesList(moduleCache);
          
          // Update module count on dashboard
          updateModuleCount(moduleCache.length);
          
          return moduleCache;
        } else {
          throw new Error('Failed to load modules');
        }
      } catch (error) {
        console.error('Error loading modules:', error);
        
        // Check if it's an auth error and redirect to login if necessary
        if (apiService.isAuthError(error)) {
          showToast('Your session has expired. Please log in again.', 'error');
          // Redirect to login after a slight delay
          setTimeout(() => {
            window.location.hash = '#login';
          }, 2000);
        } else {
          showToast('Failed to load modules', 'error');
        }
        
        // Return empty array
        return [];
      }
    };
    
    /**
     * Render the list of modules in the sidebar
     * @param {Array} modules - List of modules to render
     */
    const renderModulesList = (modules) => {
      const modulesList = document.getElementById('modules-list');
      
      if (!modulesList) return;
      
      // Clear current list
      modulesList.innerHTML = '';
      
      if (!modules || modules.length === 0) {
        // Show empty state
        modulesList.innerHTML = `
          <li class="text-center py-3">
            <p class="text-muted mb-2">No modules</p>
            <button class="btn btn-sm btn-outline-primary" id="empty-create-module-btn">
              <i class="fas fa-plus me-1"></i> Create First Module
            </button>
          </li>
        `;
        
        // Add event handler for empty state button
        const createBtn = document.getElementById('empty-create-module-btn');
        if (createBtn) {
          createBtn.addEventListener('click', openCreateModuleModal);
        }
        
        return;
      }
      
      // Get current module ID (if on a module page)
      const currentModuleId = getCurrentModuleId();
      
      // Sort modules by position
      const sortedModules = [...modules].sort((a, b) => a.position - b.position);
      
      // Add each module to the list
      sortedModules.forEach(module => {
        const moduleItem = document.createElement('li');
        moduleItem.className = 'module-item';
        if (module.id === currentModuleId) {
          moduleItem.classList.add('active');
        }
        moduleItem.dataset.moduleId = module.id;
        
        moduleItem.innerHTML = `
          <div class="module-color" style="background-color: ${module.color || '#3498db'}"></div>
          <div class="module-info">
            <div class="module-name">${module.name || 'Untitled Module'}</div>
            <div class="module-count">${module.noteCount || 0} notes</div>
          </div>
        `;
        
        // Add click event to navigate to module
        moduleItem.addEventListener('click', () => {
          router.navigate('modules', { path: [module.id] });
        });
        
        modulesList.appendChild(moduleItem);
      });
    };
    
    /**
     * Update module count display on dashboard
     * @param {number} count - Number of modules
     */
    const updateModuleCount = (count) => {
      const moduleCountElement = document.getElementById('module-count');
      if (moduleCountElement) {
        moduleCountElement.textContent = count;
      }
    };
    
    /**
     * Get the current module ID from the URL
     * @returns {string|null} - Current module ID or null
     */
    const getCurrentModuleId = () => {
      // Extract module ID from hash
      if (window.location.hash.startsWith('#modules/')) {
        return window.location.hash.split('/')[1];
      }
      return null;
    };
    
    /**
     * Open the create module modal
     */
    const openCreateModuleModal = () => {
      // Reset form
      const moduleForm = document.getElementById('module-form');
      const moduleIdInput = document.getElementById('module-id');
      const moduleNameInput = document.getElementById('module-name');
      const moduleDescriptionInput = document.getElementById('module-description');
      const moduleColorInput = document.getElementById('module-color');
      const modalTitle = document.getElementById('module-modal-title');
      
      if (moduleForm && modalTitle) {
        // Reset form
        moduleForm.reset();
        
        // Set default color
        if (moduleColorInput) {
          moduleColorInput.value = '#3498db';
        }
        
        // Clear module ID (for create mode)
        if (moduleIdInput) {
          moduleIdInput.value = '';
        }
        
        // Set modal title
        modalTitle.textContent = 'Create New Module';
        
        // Show modal
        const moduleModal = document.getElementById('module-modal');
        if (moduleModal) {
          const bsModal = new bootstrap.Modal(moduleModal);
          bsModal.show();
        }
      }
    };
    
    /**
     * Open the edit module modal
     * @param {string} moduleId - ID of the module to edit
     */
    const openEditModuleModal = async (moduleId) => {
      try {
        // Get module data
        const module = await getModuleById(moduleId);
        
        if (!module) {
          showToast('Module not found', 'error');
          return;
        }
        
        // Get form elements
        const moduleForm = document.getElementById('module-form');
        const moduleIdInput = document.getElementById('module-id');
        const moduleNameInput = document.getElementById('module-name');
        const moduleDescriptionInput = document.getElementById('module-description');
        const moduleColorInput = document.getElementById('module-color');
        const modalTitle = document.getElementById('module-modal-title');
        
        if (moduleForm && moduleNameInput && modalTitle) {
          // Reset form
          moduleForm.reset();
          
          // Set module data
          if (moduleIdInput) {
            moduleIdInput.value = module.id;
          }
          
          moduleNameInput.value = module.name || '';
          
          if (moduleDescriptionInput) {
            moduleDescriptionInput.value = module.description || '';
          }
          
          if (moduleColorInput) {
            moduleColorInput.value = module.color || '#3498db';
          }
          
          // Set modal title
          modalTitle.textContent = 'Edit Module';
          
          // Show modal
          const moduleModal = document.getElementById('module-modal');
          if (moduleModal) {
            const bsModal = new bootstrap.Modal(moduleModal);
            bsModal.show();
          }
        }
      } catch (error) {
        console.error('Failed to open edit module modal:', error);
        showToast('Failed to load module data for editing', 'error');
      }
    };
    
    /**
     * Handle save module button click
     */
    const handleSaveModule = async () => {
      try {
        // Get form data
        const moduleIdInput = document.getElementById('module-id');
        const moduleNameInput = document.getElementById('module-name');
        const moduleDescriptionInput = document.getElementById('module-description');
        const moduleColorInput = document.getElementById('module-color');
        
        if (!moduleNameInput || !moduleNameInput.value.trim()) {
          showToast('Module name is required', 'error');
          return;
        }
        
        // Show loading state
        const saveButton = document.getElementById('save-module-btn');
        if (saveButton) {
          saveButton.disabled = true;
          saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        // Prepare module data
        const moduleData = {
          name: moduleNameInput.value.trim(),
          description: moduleDescriptionInput ? moduleDescriptionInput.value.trim() : '',
          color: moduleColorInput ? moduleColorInput.value : '#3498db'
        };
        
        let response;
        
        // Check if editing or creating
        if (moduleIdInput && moduleIdInput.value) {
          // Editing existing module
          response = await apiService.put(`/modules/${moduleIdInput.value}`, moduleData);
        } else {
          // Creating new module
          response = await apiService.post('/modules', moduleData);
        }
        
        // Hide modal
        const moduleModal = document.getElementById('module-modal');
        if (moduleModal) {
          const bsModal = bootstrap.Modal.getInstance(moduleModal);
          bsModal.hide();
        }
        
        // Reset button state
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.innerHTML = 'Save';
        }
        
        if (response.success) {
          showToast(moduleIdInput && moduleIdInput.value ? 'Module updated successfully' : 'Module created successfully', 'success');
          
          // Refresh modules list
          await loadModules();
          
          // If editing, refresh current page
          if (moduleIdInput && moduleIdInput.value && moduleIdInput.value === getCurrentModuleId()) {
            // Reload current module page
            loadModulePage(moduleIdInput.value);
          } else if (!moduleIdInput || !moduleIdInput.value) {
            // If creating, navigate to the new module
            if (response.data && response.data.id) {
              router.navigate('modules', { path: [response.data.id] });
            }
          }
        } else {
          showToast(response.message || 'Failed to save module', 'error');
        }
      } catch (error) {
        console.error('Failed to save module:', error);
        
        // Hide modal
        const moduleModal = document.getElementById('module-modal');
        if (moduleModal) {
          const bsModal = bootstrap.Modal.getInstance(moduleModal);
          bsModal.hide();
        }
        
        // Reset button state
        const saveButton = document.getElementById('save-module-btn');
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.innerHTML = 'Save';
        }
        
        showToast('Failed to save module', 'error');
      }
    };
    
    /**
     * Confirm delete module
     * @param {string} moduleId - ID of the module to delete
     */
    const confirmDeleteModule = async (moduleId) => {
      try {
        // Get module data
        const module = await getModuleById(moduleId);
        
        if (!module) {
          showToast('Module not found', 'error');
          return;
        }
        
        // Set confirmation message
        const confirmationMessage = document.getElementById('delete-confirmation-message');
        if (confirmationMessage) {
          confirmationMessage.innerHTML = `
            Are you sure you want to delete the module <strong>${module.name}</strong>?
            <br><br>
            This will permanently delete the module and all notes within it. This action cannot be undone.
          `;
        }
        
        // Store module ID for deletion
        const confirmButton = document.getElementById('confirm-delete-btn');
        if (confirmButton) {
          confirmButton.dataset.deleteType = 'module';
          confirmButton.dataset.deleteId = moduleId;
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
      
      if (deleteType !== 'module' || !deleteId) {
        return;
      }
      
      try {
        // Show loading state
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        
        // Delete module
        const response = await apiService.delete(`/modules/${deleteId}`);
        
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
          showToast('Module deleted successfully', 'success');
          
          // Refresh modules list
          await loadModules();
          
          // If on the deleted module's page, redirect to dashboard
          if (deleteId === getCurrentModuleId()) {
            router.navigate('dashboard');
          }
        } else {
          showToast(response.message || 'Failed to delete module', 'error');
        }
      } catch (error) {
        console.error('Failed to delete module:', error);
        
        // Hide modal
        const confirmModal = document.getElementById('confirm-delete-modal');
        if (confirmModal) {
          const bsModal = bootstrap.Modal.getInstance(confirmModal);
          bsModal.hide();
        }
        
        // Reset button state
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Delete';
        
        showToast('Failed to delete module', 'error');
      }
    };
    
    /**
     * Load module page
     * @param {string} moduleId - ID of the module to load
     */
    const loadModulePage = async (moduleId) => {
      try {
        // Get module data
        const module = await getModuleById(moduleId);
        
        if (!module) {
          showToast('Module not found', 'error');
          router.navigate('dashboard');
          return;
        }
        
        // Update UI with module data
        const moduleTitle = document.getElementById('module-title');
        const moduleDescription = document.getElementById('module-description');
        
        if (moduleTitle) {
          moduleTitle.textContent = module.name || 'Untitled Module';
        }
        
        if (moduleDescription) {
          moduleDescription.textContent = module.description || 'No description provided.';
        }
        
        // Update active module in sidebar
        const moduleItems = document.querySelectorAll('.module-item');
        moduleItems.forEach(item => {
          if (item.dataset.moduleId === moduleId) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
        
        // Load notes for this module (if notes service is available)
        if (typeof notesService !== 'undefined' && notesService.getModuleNotes) {
          await notesService.getModuleNotes(moduleId);
        }
      } catch (error) {
        console.error('Failed to load module page:', error);
        showToast('Failed to load module data', 'error');
      }
    };
    
    /**
     * Get module by ID
     * @param {string} moduleId - ID of the module to retrieve
     * @returns {Promise<Object|null>} - Module data or null if not found
     */
    const getModuleById = async (moduleId) => {
      // Check cache first
      const cachedModule = moduleCache.find(m => m.id === moduleId);
      
      if (cachedModule) {
        return cachedModule;
      }
      
      try {
        const response = await apiService.get(`/modules/${moduleId}`);
        
        if (response.success && response.data) {
          // Update cache
          const existingIndex = moduleCache.findIndex(m => m.id === moduleId);
          
          if (existingIndex >= 0) {
            moduleCache[existingIndex] = response.data;
          } else {
            moduleCache.push(response.data);
          }
          
          return response.data;
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Failed to get module ${moduleId}:`, error);
        return null;
      }
    };
    
    /**
     * Update module order
     * @param {Array} orderData - Array of objects with id and position
     * @returns {Promise<boolean>} - Whether order was updated successfully
     */
    const reorderModules = async (orderData) => {
      if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
        return false;
      }
      
      try {
        const response = await apiService.put('/modules/reorder', { order: orderData });
        
        if (response.success) {
          // Update cache with new positions
          orderData.forEach(item => {
            const cacheIndex = moduleCache.findIndex(m => m.id === item.id);
            
            if (cacheIndex >= 0) {
              moduleCache[cacheIndex].position = item.position;
            }
          });
          
          return true;
        } else {
          throw new Error(response.message || 'Failed to update order');
        }
      } catch (error) {
        console.error('Failed to reorder modules:', error);
        return false;
      }
    };
    
    /**
     * Get all user modules
     * @returns {Promise<Array>} - List of modules
     */
    const getUserModules = async () => {
      // Return cache if available
      if (moduleCache.length > 0) {
        return moduleCache;
      }
      
      // Otherwise, load modules
      return loadModules();
    };
    
    // Public API
    return {
      init,
      loadModules,
      getModuleById,
      getUserModules,
      openCreateModuleModal,
      openEditModuleModal,
      loadModulePage
    };
  })();
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules service after authentication is ready
    if (typeof authService !== 'undefined') {
      authService.addAuthListener(state => {
        if (state.isAuthenticated) {
          modulesService.init();
        }
      });
    } else {
      console.warn('Auth service not available, modules initialization may be delayed');
      
      // Try to initialize anyway after a delay
      setTimeout(() => {
        if (typeof authService !== 'undefined' && authService.getIsAuthenticated()) {
          modulesService.init();
        }
      }, 1000);
    }
  });