/**
 * Main Application JavaScript
 * Initializes the application and handles routing
 */

// App State
const appState = {
    currentPage: null,
    currentModule: null,
    currentNote: null,
    isLoading: false,
    isInitialized: false
  };
  
  // Router
  const appRouter = {
    init: () => {
      // Handle navigation through hash changes
      window.addEventListener('hashchange', () => {
        appRouter.handleRouteChange();
      });
      
      // Initial route handling
      appRouter.handleRouteChange();
    },
    
    handleRouteChange: () => {
      const hash = window.location.hash.substring(1) || '';
      
      // Parse route
      appRouter.parseRoute(hash);
    },
    
    parseRoute: (route) => {
      if (!route) {
        // Default route
        if (authService.getIsAuthenticated()) {
          loadPage('dashboard');
        } else {
          loadPage('landing');
        }
        return;
      }
      
      // Split route by slashes
      const parts = route.split('/');
      const page = parts[0];
      
      if (page === 'login') {
        loadPage('login');
      } else if (page === 'register') {
        loadPage('register');
      } else if (page === 'dashboard') {
        if (!authService.getIsAuthenticated()) {
          // Redirect to login if not authenticated
          appRouter.navigate('login');
          return;
        }
        loadPage('dashboard');
      } else if (page === 'modules' && parts[1]) {
        if (!authService.getIsAuthenticated()) {
          // Redirect to login if not authenticated
          appRouter.navigate('login');
          return;
        }
        loadPage('module', { id: parts[1] });
      } else if (page === 'notes' && parts[1]) {
        if (!authService.getIsAuthenticated()) {
          // Redirect to login if not authenticated
          appRouter.navigate('login');
          return;
        }
        loadPage('note', { id: parts[1] });
      } else if (page === 'editor') {
        if (!authService.getIsAuthenticated()) {
          // Redirect to login if not authenticated
          appRouter.navigate('login');
          return;
        }
        const moduleId = parts[1] || null;
        const noteId = parts[2] || null;
        loadPage('editor', { moduleId, noteId });
      } else if (page === 'account') {
        if (!authService.getIsAuthenticated()) {
          // Redirect to login if not authenticated
          appRouter.navigate('login');
          return;
        }
        const section = parts[1] || 'profile';
        loadPage('account', { section });
      } else {
        // Default route
        if (authService.getIsAuthenticated()) {
          loadPage('dashboard');
        } else {
          loadPage('landing');
        }
      }
    },
    
    navigate: (page, params = {}) => {
      let url = `#${page}`;
      
      if (page === 'module' && params.id) {
        url = `#modules/${params.id}`;
      } else if (page === 'note' && params.id) {
        url = `#notes/${params.id}`;
      } else if (page === 'editor') {
        url = `#editor`;
        if (params.moduleId) {
          url += `/${params.moduleId}`;
          if (params.noteId) {
            url += `/${params.noteId}`;
          }
        }
      } else if (page === 'account') {
        url = `#account/${params.section || 'profile'}`;
      }
      
      // Update URL
      window.location.hash = url;
    }
  };
  
  // DOM Elements
  const domElements = {
    appContainer: document.getElementById('app-container'),
    loadingOverlay: document.getElementById('loading-overlay'),
    sidebarToggle: null, // Will be initialized when available
    sidebar: null, // Will be initialized when available
    modulesContainer: null, // Will be initialized when available
    mainContent: null // Will be initialized when available
  };
  
  // Helper Functions
  const setLoading = (isLoading) => {
    appState.isLoading = isLoading;
    
    if (domElements.loadingOverlay) {
      domElements.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
    }
  };
  
  const showToast = (message, type = 'info', duration = 3000) => {
    const toast = document.getElementById('toast-notification');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toast || !toastTitle || !toastMessage || !toastIcon) {
      console.warn('Toast elements not found');
      return;
    }
    
    // Set icon based on type
    let iconClass = 'fa-info-circle';
    let titleText = 'Information';
    
    if (type === 'success') {
      iconClass = 'fa-check-circle';
      titleText = 'Success';
    } else if (type === 'warning') {
      iconClass = 'fa-exclamation-triangle';
      titleText = 'Warning';
    } else if (type === 'error') {
      iconClass = 'fa-exclamation-circle';
      titleText = 'Error';
    }
    
    // Set toast content
    toastIcon.className = `fas ${iconClass} me-2`;
    toastTitle.textContent = titleText;
    toastMessage.textContent = message;
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast, {
      delay: duration
    });
    
    bsToast.show();
  };
  
  const loadPage = async (page, params = {}) => {
    try {
      setLoading(true);
      
      // Update app state
      appState.currentPage = page;
      
      // Load page content based on route
      if (page === 'landing') {
        await loadLandingPage();
      } else if (page === 'login') {
        await loadLoginPage();
      } else if (page === 'register') {
        await loadRegisterPage();
      } else if (page === 'dashboard') {
        await loadDashboardPage();
      } else if (page === 'module') {
        await loadModulePage(params.id);
      } else if (page === 'note') {
        await loadNotePage(params.id);
      } else if (page === 'editor') {
        await loadEditorPage(params.moduleId, params.noteId);
      } else if (page === 'account') {
        await loadAccountPage(params.section);
      } else {
        // Default to landing or dashboard based on auth state
        if (authService.getIsAuthenticated()) {
          await loadDashboardPage();
        } else {
          await loadLandingPage();
        }
      }
    } catch (error) {
      console.error(`Error loading page ${page}:`, error);
      showToast(`Failed to load page: ${error.message}`, 'error');
      
      // Fallback to landing page on error
      if (page !== 'landing' && page !== 'login') {
        try {
          if (authService.getIsAuthenticated()) {
            await loadDashboardPage();
          } else {
            await loadLandingPage();
          }
        } catch (fallbackError) {
          console.error('Failed to load fallback page:', fallbackError);
          // Last resort - show a message in the app container
          domElements.appContainer.innerHTML = `
            <div class="container mt-5">
              <div class="alert alert-danger">
                <h4>Error Loading Application</h4>
                <p>There was a problem loading the application. Please try refreshing the page.</p>
              </div>
            </div>
          `;
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Page Loading Functions
  const loadLandingPage = async () => {
    try {
      const response = await fetch('html/landing.html');
      
      if (!response.ok) {
        throw new Error(`Failed to load landing page: ${response.status}`);
      }
      
      const html = await response.text();
      
      domElements.appContainer.innerHTML = html;
      
      // Initialize landing page components
      initializeLandingPage();
    } catch (error) {
      console.error('Failed to load landing page:', error);
      // Show a basic fallback for landing page
      domElements.appContainer.innerHTML = `
        <div class="container mt-5 text-center">
          <h1>Welcome to NoteTaker</h1>
          <p class="lead">Your hierarchical note-taking solution</p>
          <div class="mt-4">
            <a href="#login" class="btn btn-primary">Login</a>
            <a href="#register" class="btn btn-outline-primary ms-2">Register</a>
          </div>
        </div>
      `;
      throw error;
    }
  };
  
  const loadLoginPage = async () => {
    try {
      const response = await fetch('html/login.html');
      
      if (!response.ok) {
        throw new Error(`Failed to load login page: ${response.status}`);
      }
      
      const html = await response.text();
      
      domElements.appContainer.innerHTML = html;
      
      // Initialize login form
      initializeLoginForm();
    } catch (error) {
      console.error('Failed to load login page:', error);
      // Show a basic fallback for login page
      domElements.appContainer.innerHTML = `
        <div class="container mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">Login</div>
                <div class="card-body">
                  <form id="basic-login-form">
                    <div class="mb-3">
                      <label for="email" class="form-label">Email address</label>
                      <input type="email" class="form-control" id="email" required>
                    </div>
                    <div class="mb-3">
                      <label for="password" class="form-label">Password</label>
                      <input type="password" class="form-control" id="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                  </form>
                  <div class="mt-3">
                    <a href="#register">Don't have an account? Register</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Initialize basic login form
      document.getElementById('basic-login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (email && password) {
          try {
            await authService.login(email, password);
            appRouter.navigate('dashboard');
          } catch (loginError) {
            alert('Login failed: ' + (loginError.message || 'Please check your credentials'));
          }
        }
      });
      
      throw error;
    }
  };
  
  const loadRegisterPage = async () => {
    try {
      const response = await fetch('html/register.html');
      
      if (!response.ok) {
        throw new Error(`Failed to load register page: ${response.status}`);
      }
      
      const html = await response.text();
      
      domElements.appContainer.innerHTML = html;
      
      // Initialize registration form
      initializeRegisterForm();
    } catch (error) {
      console.error('Failed to load register page:', error);
      // Show a basic fallback for register page
      domElements.appContainer.innerHTML = `
        <div class="container mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">Register</div>
                <div class="card-body">
                  <div class="alert alert-warning">
                    <p>The registration page could not be loaded properly. Please try again later.</p>
                  </div>
                  <div class="mt-3">
                    <a href="#login">Back to Login</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      throw error;
    }
  };
  
  const loadDashboardPage = async () => {
    try {
      // Check authentication
      if (!authService.getIsAuthenticated()) {
        appRouter.navigate('login');
        return;
      }
      
      const response = await fetch('html/dashboard.html');
      
      if (!response.ok) {
        throw new Error(`Failed to load dashboard page: ${response.status}`);
      }
      
      const html = await response.text();
      
      domElements.appContainer.innerHTML = html;
      
      // Initialize dashboard components
      await initializeDashboard();
    } catch (error) {
      console.error('Failed to load dashboard page:', error);
      throw error;
    }
  };
  
  const loadModulePage = async (moduleId) => {
    try {
      // Check authentication
      if (!authService.getIsAuthenticated()) {
        appRouter.navigate('login');
        return;
      }
      
      // Load module data
      appState.currentModule = await modulesService.getModuleById(moduleId);
      
      const response = await fetch('html/module-view.html');
      
      if (!response.ok) {
        throw new Error(`Failed to load module page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Update app container
      domElements.appContainer.innerHTML = html;
      
      // Initialize module view components
      await initializeModuleView(moduleId);
    } catch (error) {
      console.error(`Failed to load module page for ID ${moduleId}:`, error);
      throw error;
    }
  };
  
  const loadNotePage = async (noteId) => {
    try {
      // Check authentication
      if (!authService.getIsAuthenticated()) {
        appRouter.navigate('login');
        return;
      }
      
      // Load note data
      const note = await notesService.getNoteById(noteId);
      appState.currentNote = note;
      
      const response = await fetch('html/note-view.html');
      
      if (!response.ok) {
        throw new Error(`Failed to load note page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Update app container
      domElements.appContainer.innerHTML = html;
      
      // Initialize note view components
      await initializeNoteView(noteId);
    } catch (error) {
      console.error(`Failed to load note page for ID ${noteId}:`, error);
      throw error;
    }
  };
  
  const loadEditorPage = async (moduleId, noteId) => {
    try {
      // Check authentication
      if (!authService.getIsAuthenticated()) {
        appRouter.navigate('login');
        return;
      }
      
      // Load module data
      if (moduleId) {
        appState.currentModule = await modulesService.getModuleById(moduleId);
      }
      
      // Load note data if editing existing note
      if (noteId) {
        appState.currentNote = await notesService.getNoteById(noteId);
      } else {
        // Reset note state for new note
        appState.currentNote = null;
      }
      
      const response = await fetch('html/note-editor.html');
      
      if (!response.ok) {
        throw new Error(`Failed to load editor page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Update app container
      domElements.appContainer.innerHTML = html;
      
      // Initialize editor components
      await initializeNoteEditor(moduleId, noteId);
    } catch (error) {
      console.error(`Failed to load editor page:`, error);
      throw error;
    }
  };
  
  const loadAccountPage = async (section = 'profile') => {
    try {
      // Check authentication
      if (!authService.getIsAuthenticated()) {
        appRouter.navigate('login');
        return;
      }
      
      // Load account page based on section
      let pageUrl = 'html/account-profile.html';
      
      if (section === 'security') {
        pageUrl = 'html/account-security.html';
      } else if (section === 'tier') {
        pageUrl = 'html/account-tier.html';
      } else if (section === 'usage') {
        pageUrl = 'html/account-usage.html';
      } else if (section === 'preferences') {
        pageUrl = 'html/account-preferences.html';
      }
      
      const response = await fetch(pageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load account page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Update app container
      domElements.appContainer.innerHTML = html;
      
      // Initialize account page components
      await initializeAccountPage(section);
    } catch (error) {
      console.error(`Failed to load account page for section ${section}:`, error);
      throw error;
    }
  };
  
  // Page Initialization Functions
  
  // Initialize dashboard components
  const initializeDashboard = async () => {
    try {
      console.log('Initializing dashboard components...');
      
      // Update DOM element references
      domElements.sidebarToggle = document.getElementById('sidebar-toggle');
      domElements.sidebar = document.getElementById('app-sidebar');
      domElements.modulesContainer = document.getElementById('modules-container');
      domElements.mainContent = document.querySelector('.main-content');
      
      // Get user data
      const user = authService.getCurrentUser();
      
      // Update welcome message
      const welcomeUserName = document.getElementById('welcome-user-name');
      if (welcomeUserName && user) {
        welcomeUserName.textContent = user.displayName || 'User';
      }
      
      // Update current date
      const currentDateElement = document.getElementById('current-date');
      if (currentDateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = new Date().toLocaleDateString(undefined, options);
      }
      
      // Update user display in header
      const headerUserName = document.getElementById('header-user-name');
      if (headerUserName && user) {
        headerUserName.textContent = user.displayName || 'User';
      }
      
      const headerUserAvatar = document.getElementById('header-user-avatar');
      if (headerUserAvatar && user && user.photoURL) {
        headerUserAvatar.src = user.photoURL;
      }
      
      // Set up logout button
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            setLoading(true);
            await authService.logout();
            appRouter.navigate('login');
          } catch (error) {
            console.error('Logout failed:', error);
            showToast('Logout failed: ' + error.message, 'error');
          } finally {
            setLoading(false);
          }
        });
      }
      
      // Initialize sidebar toggle
      if (domElements.sidebarToggle && domElements.sidebar) {
        domElements.sidebarToggle.addEventListener('click', () => {
          domElements.sidebar.classList.toggle('expanded');
        });
      }
      
      // Load modules list
      try {
        // If we have the modules service
        if (typeof modulesService !== 'undefined' && modulesService.getUserModules) {
          const modules = await modulesService.getUserModules();
          renderModulesList(modules);
        } else {
          console.log('Modules service not available, skipping module loading');
          // Render placeholder modules for development
          renderPlaceholderModules();
        }
      } catch (moduleError) {
        console.error('Failed to load modules:', moduleError);
        showToast('Failed to load modules', 'error');
        renderPlaceholderModules();
      }
      
      // Initialize module count
      updateModuleCount();
      
      // Initialize note count
      updateNoteCount();
      
      // Initialize storage usage
      updateStorageUsage();
      
      // Initialize quick action buttons
      initializeQuickActions();
      
      // Load recent activity
      loadRecentActivity();
      
      // Load recent notes
      loadRecentNotes();
      
      console.log('Dashboard initialization complete');
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      showToast('Error initializing dashboard', 'error');
    }
  };
  
  // Helper functions for dashboard
  const renderModulesList = (modules) => {
    const modulesList = document.getElementById('modules-list');
    if (!modulesList) return;
    
    // Clear placeholder
    modulesList.innerHTML = '';
    
    if (!modules || modules.length === 0) {
      modulesList.innerHTML = '<li class="text-center py-3">No modules found</li>';
      return;
    }
    
    // Sort modules by position
    modules.sort((a, b) => a.position - b.position);
    
    // Render each module
    modules.forEach(module => {
      const moduleItem = document.createElement('li');
      moduleItem.className = 'module-item';
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
        appRouter.navigate('module', { id: module.id });
      });
      
      modulesList.appendChild(moduleItem);
    });
  };
  
  const renderPlaceholderModules = () => {
    const modulesList = document.getElementById('modules-list');
    if (!modulesList) return;
    
    modulesList.innerHTML = `
      <li class="module-item">
        <div class="module-color" style="background-color: #3498db"></div>
        <div class="module-info">
          <div class="module-name">Work Projects</div>
          <div class="module-count">5 notes</div>
        </div>
      </li>
      <li class="module-item">
        <div class="module-color" style="background-color: #2ecc71"></div>
        <div class="module-info">
          <div class="module-name">Personal</div>
          <div class="module-count">3 notes</div>
        </div>
      </li>
      <li class="module-item">
        <div class="module-color" style="background-color: #e74c3c"></div>
        <div class="module-info">
          <div class="module-name">Research</div>
          <div class="module-count">2 notes</div>
        </div>
      </li>
    `;
    
    // Add click handlers to show a message
    document.querySelectorAll('.module-item').forEach(item => {
      item.addEventListener('click', () => {
        showToast('This is a placeholder module', 'info');
      });
    });
  };
  
  const updateModuleCount = () => {
    const moduleCountElement = document.getElementById('module-count');
    if (!moduleCountElement) return;
    
    // If we have access to the user data
    const user = authService.getCurrentUser();
    if (user && user.moduleCount !== undefined) {
      moduleCountElement.textContent = user.moduleCount;
    } else {
      // Placeholder
      moduleCountElement.textContent = '3';
    }
  };
  
  const updateNoteCount = () => {
    const noteCountElement = document.getElementById('note-count');
    if (!noteCountElement) return;
    
    // If we have access to the user data
    const user = authService.getCurrentUser();
    if (user && user.noteCount !== undefined) {
      noteCountElement.textContent = user.noteCount;
    } else {
      // Placeholder
      noteCountElement.textContent = '10';
    }
  };
  
  const updateStorageUsage = () => {
    const storageUsedElement = document.getElementById('storage-used');
    const storageProgressElement = document.getElementById('storage-progress');
    const storageTextElement = document.getElementById('storage-text');
    
    if (!storageUsedElement) return;
    
    // If we have access to the user data
    const user = authService.getCurrentUser();
    if (user && user.storageUsed !== undefined) {
      const storageUsedMB = (user.storageUsed / (1024 * 1024)).toFixed(2);
      storageUsedElement.textContent = `${storageUsedMB} MB`;
      
      // Update progress bar if available
      if (storageProgressElement && storageTextElement && user.tier) {
        const tierConfig = {
          free: 50 * 1024 * 1024, // 50MB
          pro: 5 * 1024 * 1024 * 1024 // 5GB
        };
        
        const maxStorage = tierConfig[user.tier] || tierConfig.free;
        const usagePercent = (user.storageUsed / maxStorage) * 100;
        
        storageProgressElement.style.width = `${Math.min(usagePercent, 100)}%`;
        storageTextElement.textContent = `${Math.round(usagePercent)}% of ${maxStorage / (1024 * 1024)}MB used`;
      }
    } else {
      // Placeholder
      storageUsedElement.textContent = '12.5 MB';
      
      // Update progress bar with placeholder if available
      if (storageProgressElement && storageTextElement) {
        storageProgressElement.style.width = '25%';
        storageTextElement.textContent = '25% of 50MB used';
      }
    }
  };
  
  const initializeQuickActions = () => {
    // New Module Action
    const newModuleAction = document.getElementById('new-module-action');
    if (newModuleAction) {
      newModuleAction.addEventListener('click', () => {
        // In a real app, this would open a modal to create a new module
        showToast('Creating a new module...', 'info');
        
        // For demo purposes, let's simulate opening a modal
        // In a real app, you'd use Bootstrap's modal API or navigate to a new module page
        const modalHTML = `
          <div class="modal" tabindex="-1" id="temp-module-modal">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Create New Module</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <form id="quick-module-form">
                    <div class="mb-3">
                      <label for="module-name" class="form-label">Module Name</label>
                      <input type="text" class="form-control" id="module-name" required>
                    </div>
                    <div class="mb-3">
                      <label for="module-color" class="form-label">Color</label>
                      <input type="color" class="form-control form-control-color" id="module-color" value="#3498db">
                    </div>
                  </form>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-primary" id="save-module-btn">Create Module</button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Append modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Initialize the modal
        const modal = new bootstrap.Modal(document.getElementById('temp-module-modal'));
        modal.show();
        
        // Handle save button
        document.getElementById('save-module-btn')?.addEventListener('click', () => {
          const moduleName = document.getElementById('module-name')?.value;
          const moduleColor = document.getElementById('module-color')?.value;
          
          if (moduleName) {
            // In a real app, this would call the module service to create a module
            showToast(`Module "${moduleName}" created!`, 'success');
            modal.hide();
            
            // Clean up modal after hiding
            modal._element.addEventListener('hidden.bs.modal', () => {
              document.body.removeChild(modalContainer);
            });
          } else {
            showToast('Please enter a module name', 'warning');
          }
        });
      });
    }
    
    // New Note Action
    const newNoteAction = document.getElementById('new-note-action');
    if (newNoteAction) {
      newNoteAction.addEventListener('click', () => {
        // In a real app, this would navigate to the note editor page
        showToast('Select a module for your new note', 'info');
        
        // For demo purposes, let's simulate opening a module selector
        const modalHTML = `
          <div class="modal" tabindex="-1" id="temp-note-modal">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Create New Note</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <form id="quick-note-form">
                    <div class="mb-3">
                      <label for="note-module" class="form-label">Select Module</label>
                      <select class="form-select" id="note-module" required>
                        <option value="" selected disabled>Choose a module</option>
                        <option value="1">Work Projects</option>
                        <option value="2">Personal</option>
                        <option value="3">Research</option>
                      </select>
                    </div>
                  </form>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-primary" id="continue-note-btn">Continue</button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Append modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Initialize the modal
        const modal = new bootstrap.Modal(document.getElementById('temp-note-modal'));
        modal.show();
        
        // Handle continue button
        document.getElementById('continue-note-btn')?.addEventListener('click', () => {
          const moduleSelect = document.getElementById('note-module');
          const moduleId = moduleSelect?.value;
          
          if (moduleId) {
            // In a real app, this would navigate to the note editor page
            showToast('Creating a new note in the selected module', 'success');
            modal.hide();
            
            // Clean up modal after hiding
            modal._element.addEventListener('hidden.bs.modal', () => {
              document.body.removeChild(modalContainer);
            });
            
            // Simulate navigation to editor page
            appRouter.navigate('editor', { moduleId });
          } else {
            showToast('Please select a module', 'warning');
          }
        });
      });
    }
    
    // Upload Media Action
    const uploadMediaAction = document.getElementById('upload-media-action');
    if (uploadMediaAction) {
      uploadMediaAction.addEventListener('click', () => {
        showToast('Please select a note to upload media to', 'info');
      });
    }
    
    // Account Action
    const accountAction = document.getElementById('account-action');
    if (accountAction) {
      accountAction.addEventListener('click', () => {
        appRouter.navigate('account', { section: 'profile' });
      });
    }
  };
  
  const loadRecentActivity = () => {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // In a real app, this would fetch actual activity data
    // For now, we'll keep the placeholder data that's already in the HTML
  };
  
  const loadRecentNotes = () => {
    const recentNotesList = document.getElementById('recent-notes-list');
    if (!recentNotesList) return;
    
    // In a real app, this would fetch actual note data
    // For now, we'll keep the placeholder data that's already in the HTML
  };
  
  // Initialize module view components
  const initializeModuleView = async (moduleId) => {
    // This is a placeholder for now
    console.log(`Module view for ${moduleId} would be initialized here`);
  };
  
  // Initialize note view components
  const initializeNoteView = async (noteId) => {
    // This is a placeholder for now
    console.log(`Note view for ${noteId} would be initialized here`);
  };
  
  // Initialize note editor components
  const initializeNoteEditor = async (moduleId, noteId) => {
    // This is a placeholder for now
    console.log(`Note editor for module ${moduleId} and note ${noteId || 'new'} would be initialized here`);
  };
  
  // Initialize account page components
  const initializeAccountPage = async (section) => {
    // This is a placeholder for now
    console.log(`Account page for section ${section} would be initialized here`);
  };
  
  // Initialize landing page components
  const initializeLandingPage = () => {
    // Implement landing page initialization
    console.log('Landing page initialized');
    
    // Attach event listeners for login/register buttons
    document.querySelectorAll('a[href="#login"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        appRouter.navigate('login');
      });
    });
    
    document.querySelectorAll('a[href="#register"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        appRouter.navigate('register');
      });
    });
  };
  
  // Initialize login form
  const initializeLoginForm = () => {
    // Implement login form initialization
    console.log('Login form initialized');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email')?.value;
        const password = document.getElementById('login-password')?.value;
        
        if (!email || !password) {
          showToast('Please enter both email and password', 'error');
          return;
        }
        
        try {
          setLoading(true);
          await authService.login(email, password);
          appRouter.navigate('dashboard');
        } catch (error) {
          console.error('Login failed:', error);
          
          // Show error message
          const errorAlert = document.getElementById('login-error-alert');
          const errorMessage = document.getElementById('login-error-message');
          
          if (errorAlert && errorMessage) {
            errorMessage.textContent = error.message || 'Invalid email or password';
            errorAlert.classList.remove('d-none');
          } else {
            showToast(error.message || 'Login failed', 'error');
          }
        } finally {
          setLoading(false);
        }
      });
    }
    
    // Add event listeners for register link
    document.querySelectorAll('a[href="#register"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        appRouter.navigate('register');
      });
    });
  };
  
  // Initialize register form
  const initializeRegisterForm = () => {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name')?.value;
        const email = document.getElementById('register-email')?.value;
        const password = document.getElementById('register-password')?.value;
        const confirmPassword = document.getElementById('register-confirm-password')?.value;
        
        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
          showToast('Please fill in all fields', 'error');
          return;
        }
        
        if (password !== confirmPassword) {
          showToast('Passwords do not match', 'error');
          return;
        }
        
        try {
          setLoading(true);
          const result = await authService.register(email, password, name);
          
          if (result.success) {
            showToast('Registration successful!', 'success');
            appRouter.navigate('dashboard');
          } else {
            throw new Error(result.message || 'Registration failed');
          }
        } catch (error) {
          console.error('Registration failed:', error);
          
          // Show error message
          const errorAlert = document.getElementById('register-error-alert');
          const errorMessage = document.getElementById('register-error-message');
          
          if (errorAlert && errorMessage) {
            errorMessage.textContent = error.message || 'Registration failed';
            errorAlert.classList.remove('d-none');
          } else {
            showToast(error.message || 'Registration failed', 'error');
          }
        } finally {
          setLoading(false);
        }
      });
    }
    
    // Add event listeners for login link
    document.querySelectorAll('a[href="#login"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        appRouter.navigate('login');
      });
    });
  };
  
  // Initialize the app
  const initApp = async () => {
    try {
      setLoading(true);
  
      // Add listener for auth state changes
      authService.addAuthListener((authState) => {
        // When auth state changes, update routing if needed
        if (appState.isInitialized) {
          const currentHash = window.location.hash.substring(1);
          
          // If we're on a protected route and not authenticated, redirect to login
          if (!authState.isAuthenticated && 
              (currentHash.startsWith('dashboard') || 
               currentHash.startsWith('modules') || 
               currentHash.startsWith('notes') || 
               currentHash.startsWith('editor') || 
               currentHash.startsWith('account'))) {
            appRouter.navigate('login');
          }
          
          // If we're on login/register and authenticated, redirect to dashboard
          if (authState.isAuthenticated && 
              (currentHash === 'login' || currentHash === 'register')) {
            appRouter.navigate('dashboard');
          }
        }
      });
  
      // Initialize appRouter after auth is ready
      appRouter.init();
      
      // Mark app as initialized
      appState.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize application:', error);
      
      // Show error message
      domElements.appContainer.innerHTML = `
        <div class="container mt-5">
          <div class="alert alert-danger">
            <h4>Application Error</h4>
            <p>There was a problem initializing the application. Please try refreshing the page.</p>
            <p>Error: ${error.message}</p>
          </div>
        </div>
      `;
    } finally {
      // Always remove loading overlay
      setLoading(false);
    }
  };
  
  // Define dummy moduleService if not available
  if (typeof modulesService === 'undefined') {
    window.modulesService = {
      getUserModules: async () => {
        // Return placeholder modules
        return [
          { id: '1', name: 'Work Projects', color: '#3498db', position: 1, noteCount: 5 },
          { id: '2', name: 'Personal', color: '#2ecc71', position: 2, noteCount: 3 },
          { id: '3', name: 'Research', color: '#e74c3c', position: 3, noteCount: 2 }
        ];
      },
      getModuleById: async (id) => {
        // Return a placeholder module
        return { 
          id, 
          name: 'Module ' + id, 
          color: '#3498db', 
          position: 1, 
          noteCount: 5,
          description: 'This is a placeholder module description'
        };
      }
    };
  }
  
  // Define dummy notesService if not available
  if (typeof notesService === 'undefined') {
    window.notesService = {
      getNoteById: async (id) => {
        // Return a placeholder note
        return { 
          id, 
          title: 'Note ' + id, 
          content: 'This is a placeholder note content',
          moduleId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      },
      getModuleNotes: async (moduleId) => {
        // Return placeholder notes
        return [
          { id: '1', title: 'Note 1', content: 'Content 1', moduleId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '2', title: 'Note 2', content: 'Content 2', moduleId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '3', title: 'Note 3', content: 'Content 3', moduleId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
      }
    };
  }
  
  // Initialize when document is ready
  document.addEventListener('DOMContentLoaded', initApp);