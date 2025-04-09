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
  const router = {
    init: () => {
      // Handle navigation through hash changes
      window.addEventListener('hashchange', () => {
        router.handleRouteChange();
      });
      
      // Initial route handling
      router.handleRouteChange();
    },
    
    handleRouteChange: () => {
      const hash = window.location.hash.substring(1) || '';
      
      // Parse route
      router.parseRoute(hash);
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
        loadPage('dashboard');
      } else if (page === 'modules' && parts[1]) {
        loadPage('module', { id: parts[1] });
      } else if (page === 'notes' && parts[1]) {
        loadPage('note', { id: parts[1] });
      } else if (page === 'editor') {
        const moduleId = parts[1] || null;
        const noteId = parts[2] || null;
        loadPage('editor', { moduleId, noteId });
      } else if (page === 'account') {
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
    sidebarToggle: document.getElementById('sidebar-toggle'),
    sidebar: document.getElementById('app-sidebar'),
    modulesContainer: document.getElementById('modules-container'),
    mainContent: document.querySelector('.main-content')
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
    } finally {
      setLoading(false);
    }
  };
  
  // Page Loading Functions
  const loadLandingPage = async () => {
    try {
      const response = await fetch('/html/landing.html');
      const html = await response.text();
      
      domElements.appContainer.innerHTML = html;
      
      // Initialize landing page components
      initializeLandingPage();
    } catch (error) {
      console.error('Failed to load landing page:', error);
      throw error;
    }
  };
  
  const loadLoginPage = async () => {
    try {
      const response = await fetch('/html/login.html');
      const html = await response.text();
      
      domElements.appContainer.innerHTML = html;
      
      // Initialize login form
      initializeLoginForm();
    } catch (error) {
      console.error('Failed to load login page:', error);
      throw error;
    }
  };
  
  const loadRegisterPage = async () => {
    try {
      const response = await fetch('/html/register.html');
      const html = await response.text();
      
      domElements.appContainer.innerHTML = html;
      
      // Initialize registration form
      initializeRegisterForm();
    } catch (error) {
      console.error('Failed to load register page:', error);
      throw error;
    }
  };
  
  const loadDashboardPage = async () => {
    try {
      // Check authentication
      if (!authService.getIsAuthenticated()) {
        router.navigate('login');
        return;
      }
      
      const response = await fetch('/html/dashboard.html');
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
        router.navigate('login');
        return;
      }
      
      // Load module data
      appState.currentModule = await modulesService.getModuleById(moduleId);
      
      const response = await fetch('/html/module-view.html');
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
        router.navigate('login');
        return;
      }
      
      // Load note data
      const note = await notesService.getNoteById(noteId);
      appState.currentNote = note;
      
      const response = await fetch('/html/note-view.html');
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
        router.navigate('login');
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
      
      const response = await fetch('/html/note-editor.html');
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
        router.navigate('login');
        return;
      }
      
      // Load account page based on section
      let pageUrl = '/html/account-profile.html';
      
      if (section === 'security') {
        pageUrl = '/html/account-security.html';
      } else if (section === 'tier') {
        pageUrl = '/html/account-tier.html';
      } else if (section === 'usage') {
        pageUrl = '/html/account-usage.html';
      } else if (section === 'preferences') {
        pageUrl = '/html/account-preferences.html';
      }
      
      const response = await fetch(pageUrl);
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