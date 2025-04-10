/**
 * Account Management
 * Handles user account functionality
 */

const accountService = (() => {
    // DOM elements cache
    let elements = {};
    
    /**
     * Initialize account functionality
     */
    const init = () => {
      // Only initialize if we're on an account page
      if (!window.location.hash.startsWith('#account')) {
        return;
      }
      
      console.log('Initializing account service...');
      
      // Cache DOM elements for account pages
      cacheElements();
      
      // Setup event listeners for account management
      setupEventListeners();
      
      // Load account data
      loadAccountData();
    };
    
    /**
     * Cache frequently used DOM elements
     */
    const cacheElements = () => {
      elements = {
        // Profile page elements
        profileForm: document.getElementById('profile-form'),
        displayName: document.getElementById('display-name'),
        email: document.getElementById('email'),
        bio: document.getElementById('bio'),
        emailNotifications: document.getElementById('email-notifications'),
        profileAvatar: document.getElementById('profile-avatar'),
        saveProfileBtn: document.getElementById('save-profile-btn'),
        profileSuccessAlert: document.getElementById('profile-success-alert'),
        profileErrorAlert: document.getElementById('profile-error-alert'),
        
        // Security page elements
        passwordForm: document.getElementById('password-form'),
        currentPassword: document.getElementById('current-password'),
        newPassword: document.getElementById('new-password'),
        confirmPassword: document.getElementById('confirm-password'),
        savePasswordBtn: document.getElementById('save-password-btn'),
        securitySuccessAlert: document.getElementById('security-success-alert'),
        securityErrorAlert: document.getElementById('security-error-alert'),
        
        // Common elements
        deleteAccountLink: document.getElementById('delete-account-link'),
        deleteAccountModal: document.getElementById('delete-account-modal')
      };
    };
    
    /**
     * Set up event listeners for account functionality
     */
    const setupEventListeners = () => {
      // Profile form submission
      if (elements.profileForm) {
        elements.profileForm.addEventListener('submit', handleProfileSubmit);
      }
      
      // Password form submission
      if (elements.passwordForm) {
        elements.passwordForm.addEventListener('submit', handlePasswordSubmit);
      }
      
      // Delete account link
      if (elements.deleteAccountLink) {
        elements.deleteAccountLink.addEventListener('click', handleDeleteAccountClick);
      }
      
      // Toggle password visibility
      document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', togglePasswordVisibility);
      });
      
      // Password strength meter
      if (elements.newPassword) {
        elements.newPassword.addEventListener('input', updatePasswordStrength);
      }
      
      // Password match validation
      if (elements.confirmPassword) {
        elements.confirmPassword.addEventListener('input', validatePasswordMatch);
      }
      
      // Delete account confirmation
      const deleteConfirmationInput = document.getElementById('delete-confirmation-input');
      const confirmDeleteBtn = document.getElementById('confirm-delete-account-btn');
      
      if (deleteConfirmationInput && confirmDeleteBtn) {
        deleteConfirmationInput.addEventListener('input', () => {
          confirmDeleteBtn.disabled = deleteConfirmationInput.value !== 'delete my account';
        });
        
        confirmDeleteBtn.addEventListener('click', handleConfirmDeleteAccount);
      }
    };
    
    /**
     * Load account data from server
     */
    const loadAccountData = async () => {
      try {
        const user = authService.getCurrentUser();
        
        if (!user) {
          console.warn('No authenticated user found');
          return;
        }
        
        // Load profile data if on profile page
        if (window.location.hash === '#account/profile') {
          loadProfileData(user);
        }
        
        // Load security data if on security page
        if (window.location.hash === '#account/security') {
          loadSecurityData(user);
        }
        
        // Load usage data if on usage page
        if (window.location.hash === '#account/usage') {
          loadUsageData();
        }
        
        // Load tier data if on tier page
        if (window.location.hash === '#account/tier') {
          loadTierData();
        }
        
        // Load preferences data if on preferences page
        if (window.location.hash === '#account/preferences') {
          loadPreferencesData();
        }
      } catch (error) {
        console.error('Error loading account data:', error);
        showError('Failed to load account data');
      }
    };
    
    /**
     * Load profile data into form
     * @param {Object} user - User data
     */
    const loadProfileData = async (user) => {
      try {
        if (!elements.displayName || !elements.email) {
          return;
        }
        
        // Get profile data from API
        const response = await apiService.get('/account/profile');
        
        if (response.success && response.data && response.data.profile) {
          const profile = response.data.profile;
          
          // Update form fields
          elements.displayName.value = profile.displayName || '';
          elements.email.value = profile.email || '';
          
          if (elements.bio) {
            elements.bio.value = profile.bio || '';
          }
          
          if (elements.emailNotifications) {
            elements.emailNotifications.checked = profile.emailNotifications || false;
          }
          
          // Update avatar if available
          if (elements.profileAvatar && profile.photoURL) {
            elements.profileAvatar.src = profile.photoURL;
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        showError('Failed to load profile data');
      }
    };
    
    /**
     * Load security data
     * @param {Object} user - User data
     */
    const loadSecurityData = (user) => {
      // Show email verification status
      const emailVerified = document.getElementById('email-verified');
      const emailUnverified = document.getElementById('email-unverified');
      const verifiedEmail = document.getElementById('verified-email');
      const unverifiedEmail = document.getElementById('unverified-email');
      
      if (emailVerified && emailUnverified && user) {
        if (user.emailVerified) {
          emailVerified.classList.remove('d-none');
          emailUnverified.classList.add('d-none');
          
          if (verifiedEmail) {
            verifiedEmail.textContent = user.email;
          }
        } else {
          emailVerified.classList.add('d-none');
          emailUnverified.classList.remove('d-none');
          
          if (unverifiedEmail) {
            unverifiedEmail.textContent = user.email;
          }
        }
      }
      
      // Set up send verification email button
      const sendVerificationEmailBtn = document.getElementById('send-verification-email-btn');
      
      if (sendVerificationEmailBtn) {
        sendVerificationEmailBtn.addEventListener('click', sendVerificationEmail);
      }
    };
    
    /**
     * Load usage data from server
     */
    const loadUsageData = async () => {
      try {
        // Get usage stats from API
        const response = await apiService.get('/account/usage-stats');
        
        if (response.success && response.data) {
          updateUsageStats(response.data);
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
        showError('Failed to load usage statistics');
      }
    };
    
    /**
     * Load tier data from server
     */
    const loadTierData = async () => {
      try {
        // Get tier info from API
        const response = await apiService.get('/account/tier');
        
        if (response.success && response.data) {
          updateTierInfo(response.data);
        }
      } catch (error) {
        console.error('Error loading tier data:', error);
        showError('Failed to load subscription information');
      }
    };
    
    /**
     * Load preferences data
     */
    const loadPreferencesData = () => {
      // Load saved preferences from localStorage
      const savedTheme = localStorage.getItem('app-theme') || 'light';
      const savedFontSize = localStorage.getItem('app-font-size') || '100';
      const savedPrimaryColor = localStorage.getItem('app-primary-color') || '#3498db';
      
      // Theme selection
      const themeRadios = document.querySelectorAll('input[name="theme"]');
      
      themeRadios.forEach(radio => {
        if (radio.value === savedTheme) {
          radio.checked = true;
        }
      });
      
      // Font size
      const fontSizeInput = document.getElementById('font-size');
      const fontSizeValue = document.getElementById('font-size-value');
      
      if (fontSizeInput) {
        fontSizeInput.value = savedFontSize;
      }
      
      if (fontSizeValue) {
        fontSizeValue.textContent = `${savedFontSize}%`;
      }
      
      // Primary color
      const colorRadios = document.querySelectorAll('input[name="primary-color"]');
      
      colorRadios.forEach(radio => {
        if (radio.value === savedPrimaryColor) {
          radio.checked = true;
        }
      });
      
      // Editor preferences
      const viewModeRadios = document.querySelectorAll('input[name="default-view-mode"]');
      const editorFont = document.getElementById('editor-font');
      const autosaveInterval = document.getElementById('autosave-interval');
      const spellCheck = document.getElementById('spell-check');
      const wordCount = document.getElementById('word-count');
      const lineNumbers = document.getElementById('line-numbers');
      
      // Load editor preferences from localStorage
      const savedViewMode = localStorage.getItem('editor-view-mode') || 'edit';
      const savedEditorFont = localStorage.getItem('editor-font') || 'default';
      const savedAutosaveInterval = localStorage.getItem('editor-autosave-interval') || '30';
      const savedSpellCheck = localStorage.getItem('editor-spell-check') === 'true';
      const savedWordCount = localStorage.getItem('editor-word-count') === 'true';
      const savedLineNumbers = localStorage.getItem('editor-line-numbers') === 'true';
      
      // Apply saved values
      viewModeRadios.forEach(radio => {
        if (radio.value === savedViewMode) {
          radio.checked = true;
        }
      });
      
      if (editorFont) {
        editorFont.value = savedEditorFont;
      }
      
      if (autosaveInterval) {
        autosaveInterval.value = savedAutosaveInterval;
      }
      
      if (spellCheck) {
        spellCheck.checked = savedSpellCheck;
      }
      
      if (wordCount) {
        wordCount.checked = savedWordCount;
      }
      
      if (lineNumbers) {
        lineNumbers.checked = savedLineNumbers;
      }
      
      // Notification preferences
      const emailSecurity = document.getElementById('email-security');
      const emailUpdates = document.getElementById('email-updates');
      const emailTips = document.getElementById('email-tips');
      const browserAutosave = document.getElementById('browser-autosave');
      const browserSessionTimeout = document.getElementById('browser-session-timeout');
      
      // Load notification preferences from localStorage
      const savedEmailSecurity = localStorage.getItem('notify-email-security') !== 'false';
      const savedEmailUpdates = localStorage.getItem('notify-email-updates') !== 'false';
      const savedEmailTips = localStorage.getItem('notify-email-tips') === 'true';
      const savedBrowserAutosave = localStorage.getItem('notify-browser-autosave') !== 'false';
      const savedBrowserSessionTimeout = localStorage.getItem('notify-browser-session-timeout') === 'true';
      
      // Apply saved values
      if (emailSecurity) {
        emailSecurity.checked = savedEmailSecurity;
      }
      
      if (emailUpdates) {
        emailUpdates.checked = savedEmailUpdates;
      }
      
      if (emailTips) {
        emailTips.checked = savedEmailTips;
      }
      
      if (browserAutosave) {
        browserAutosave.checked = savedBrowserAutosave;
      }
      
      if (browserSessionTimeout) {
        browserSessionTimeout.checked = savedBrowserSessionTimeout;
      }
      
      // Set up font size preview update
      if (fontSizeInput && fontSizeValue) {
        fontSizeInput.addEventListener('input', () => {
          fontSizeValue.textContent = `${fontSizeInput.value}%`;
        });
      }
      
      // Set up appearance form submission
      const appearanceForm = document.getElementById('appearance-form');
      
      if (appearanceForm) {
        appearanceForm.addEventListener('submit', handleAppearanceSubmit);
      }
      
      // Set up editor preferences form submission
      const editorPreferencesForm = document.getElementById('editor-preferences-form');
      
      if (editorPreferencesForm) {
        editorPreferencesForm.addEventListener('submit', handleEditorPreferencesSubmit);
      }
      
      // Set up notification preferences form submission
      const notificationPreferencesForm = document.getElementById('notification-preferences-form');
      
      if (notificationPreferencesForm) {
        notificationPreferencesForm.addEventListener('submit', handleNotificationPreferencesSubmit);
      }
    };
    
    /**
     * Update usage statistics display
     * @param {Object} stats - Usage statistics data
     */
    const updateUsageStats = (stats) => {
      // Update module count
      const modulesCount = document.getElementById('modules-count');
      const modulesProgress = document.getElementById('modules-progress');
      const modulesLimit = document.getElementById('modules-limit');
      
      if (modulesCount && stats.moduleCount !== undefined) {
        modulesCount.textContent = stats.moduleCount;
      }
      
      if (modulesProgress && modulesLimit && stats.tier && stats.tier.limits) {
        const moduleLimit = stats.tier.limits.modules.max;
        const moduleCount = stats.tier.limits.modules.current;
        const moduleUsagePercent = stats.tier.limits.modules.usagePercent;
        
        // Update progress bar
        modulesProgress.style.width = `${moduleUsagePercent}%`;
        modulesProgress.setAttribute('aria-valuenow', moduleUsagePercent);
        
        // Update limit text
        if (moduleLimit === Infinity || moduleLimit === -1) {
          modulesLimit.textContent = `${moduleCount} modules (unlimited)`;
        } else {
          modulesLimit.textContent = `${moduleCount} of ${moduleLimit} modules`;
        }
      }
      
      // Update note count
      const notesCount = document.getElementById('notes-count');
      const notesProgress = document.getElementById('notes-progress');
      const notesLimit = document.getElementById('notes-limit');
      
      if (notesCount && stats.noteCount !== undefined) {
        notesCount.textContent = stats.noteCount;
      }
      
      if (notesProgress && stats.noteCount !== undefined) {
        // No clear limit on total notes, so just show a nominal percentage
        const notesPercent = Math.min(stats.noteCount * 5, 100);
        notesProgress.style.width = `${notesPercent}%`;
        notesProgress.setAttribute('aria-valuenow', notesPercent);
      }
      
      if (notesLimit && stats.noteCount !== undefined) {
        notesLimit.textContent = `${stats.noteCount} notes total`;
      }
      
      // Update storage usage
      const storageUsed = document.getElementById('storage-used');
      const storageProgress = document.getElementById('storage-progress');
      const storageLimit = document.getElementById('storage-limit');
      
      if (storageUsed && stats.storageUsedFormatted) {
        storageUsed.textContent = stats.storageUsedFormatted;
      }
      
      if (storageProgress && storageLimit && stats.tier && stats.tier.limits) {
        const storageLimitBytes = stats.tier.limits.storage.max;
        const storageUsedBytes = stats.tier.limits.storage.current;
        const storageUsagePercent = stats.tier.limits.storage.usagePercent;
        
        // Update progress bar
        storageProgress.style.width = `${storageUsagePercent}%`;
        storageProgress.setAttribute('aria-valuenow', storageUsagePercent);
        
        // Update limit text
        storageLimit.textContent = `${stats.storageUsedFormatted} of ${stats.tier.limits.storage.maxFormatted} used`;
      }
      
      // Update module statistics
      const moduleStatsContainer = document.getElementById('module-stats-container');
      
      if (moduleStatsContainer && stats.tier && stats.tier.limits && stats.tier.limits.notesPerModule) {
        const modulesStats = stats.tier.limits.notesPerModule.modulesStats;
        const maxNotesPerModule = stats.tier.limits.notesPerModule.max;
        
        // Clear existing content
        moduleStatsContainer.innerHTML = '';
        
        if (modulesStats && modulesStats.length > 0) {
          // Add each module's stats
          modulesStats.forEach(module => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'module-stats-item';
            
            moduleItem.innerHTML = `
              <div class="module-stats-header">
                <div class="module-color" style="background-color: ${module.color || '#3498db'};"></div>
                <h4 class="module-name">${module.name}</h4>
              </div>
              <div class="module-stats-content">
                <div class="module-stats-count">
                  <span class="note-count">${module.noteCount}</span> / 
                  <span class="note-limit">${maxNotesPerModule === Infinity || maxNotesPerModule === -1 ? '∞' : maxNotesPerModule}</span> notes
                </div>
                <div class="progress">
                  <div class="progress-bar" role="progressbar" style="width: ${module.usagePercent}%" 
                       aria-valuenow="${module.usagePercent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            `;
            
            moduleStatsContainer.appendChild(moduleItem);
          });
        } else {
          // No modules
          moduleStatsContainer.innerHTML = `
            <div class="text-center py-4">
              <p class="text-muted">No modules found. Create a module to start organizing your notes.</p>
              <button class="btn btn-primary" id="create-first-module-btn">
                <i class="fas fa-folder-plus me-2"></i> Create First Module
              </button>
            </div>
          `;
          
          const createFirstModuleBtn = document.getElementById('create-first-module-btn');
          
          if (createFirstModuleBtn) {
            createFirstModuleBtn.addEventListener('click', () => {
              router.navigate('dashboard');
            });
          }
        }
      }
      
      // Update storage breakdown
      updateStorageBreakdown(stats);
    };
    
    /**
     * Update storage breakdown chart and stats
     * @param {Object} stats - Usage statistics with storage breakdown
     */
    const updateStorageBreakdown = (stats) => {
      // Update storage type breakdown
      const imageStorage = document.getElementById('image-storage');
      const documentStorage = document.getElementById('document-storage');
      const otherStorage = document.getElementById('other-storage');
      
      if (!stats.storage || !stats.storage.fileTypes) {
        return;
      }
      
      // Extract file type data
      const fileTypes = stats.storage.fileTypes;
      const totalSize = stats.storage.totalSize || 0;
      
      // Calculate sizes by category
      const imageSizeBytes = (fileTypes.image || 0);
      const documentSizeBytes = (fileTypes.application || 0);
      const otherSizeBytes = totalSize - imageSizeBytes - documentSizeBytes;
      
      // Calculate percentages
      const imagePercent = totalSize > 0 ? Math.round((imageSizeBytes / totalSize) * 100) : 0;
      const documentPercent = totalSize > 0 ? Math.round((documentSizeBytes / totalSize) * 100) : 0;
      const otherPercent = 100 - imagePercent - documentPercent;
      
      // Format sizes
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
      
      // Update DOM elements
      if (imageStorage) {
        imageStorage.textContent = formatBytes(imageSizeBytes);
        imageStorage.nextElementSibling.textContent = `${imagePercent}%`;
      }
      
      if (documentStorage) {
        documentStorage.textContent = formatBytes(documentSizeBytes);
        documentStorage.nextElementSibling.textContent = `${documentPercent}%`;
      }
      
      if (otherStorage) {
        otherStorage.textContent = formatBytes(otherSizeBytes);
        otherStorage.nextElementSibling.textContent = `${otherPercent}%`;
      }
      
      // Update storage chart if available
      const storageChart = document.getElementById('storage-chart');
      
      if (storageChart && typeof Chart !== 'undefined') {
        // Check if chart already exists
        if (window.storageChartInstance) {
          window.storageChartInstance.destroy();
        }
        
        // Create new chart
        const ctx = storageChart.getContext('2d');
        
        window.storageChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Images', 'Documents', 'Others'],
            datasets: [{
              data: [imageSizeBytes, documentSizeBytes, otherSizeBytes],
              backgroundColor: ['#3498db', '#2ecc71', '#e74c3c'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                position: 'bottom'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const percentage = Math.round((value / totalSize) * 100);
                    return `${context.label}: ${formatBytes(value)} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
      
      // Set up cleanup storage button
      const cleanupStorageBtn = document.getElementById('cleanup-storage-btn');
      
      if (cleanupStorageBtn) {
        cleanupStorageBtn.addEventListener('click', handleCleanupStorage);
      }
    };
    
    /**
     * Update tier information display
     * @param {Object} tierInfo - Tier information data
     */
    const updateTierInfo = (tierInfo) => {
      // Update tier badge and info
      const freePlanInfo = document.getElementById('free-plan-info');
      const proPlanInfo = document.getElementById('pro-plan-info');
      
      if (freePlanInfo && proPlanInfo) {
        if (tierInfo.tier === 'free') {
          freePlanInfo.classList.remove('d-none');
          proPlanInfo.classList.add('d-none');
          
          // Update free selection
          const selectFreeBtn = document.getElementById('select-free-plan');
          if (selectFreeBtn) {
            selectFreeBtn.disabled = true;
            selectFreeBtn.textContent = 'Current Plan';
          }
          
          // Enable pro upgrade button
          const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');
          if (upgradeToProBtn) {
            upgradeToProBtn.disabled = false;
          }
        } else {
          freePlanInfo.classList.add('d-none');
          proPlanInfo.classList.remove('d-none');
          
          // Update pro selection
          const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');
          if (upgradeToProBtn) {
            upgradeToProBtn.disabled = true;
            upgradeToProBtn.textContent = 'Current Plan';
          }
        }
      }
      
      // Update usage summary
      if (tierInfo.limits) {
        // Module usage
        const moduleUsage = document.getElementById('module-usage');
        const moduleProgress = document.getElementById('module-progress');
        
        if (moduleUsage && moduleProgress) {
          const current = tierInfo.limits.modules.current;
          const max = tierInfo.limits.modules.max;
          const percent = tierInfo.limits.modules.usagePercent;
          
          if (max === Infinity || max === -1) {
            moduleUsage.textContent = `${current} / Unlimited`;
          } else {
            moduleUsage.textContent = `${current} / ${max}`;
          }
          
          moduleProgress.style.width = `${percent}%`;
        }
        
        // Storage usage
        const storageUsage = document.getElementById('storage-usage');
        const storageProgress = document.getElementById('storage-progress');
        
        if (storageUsage && storageProgress) {
          const current = tierInfo.limits.storage.currentFormatted;
          const max = tierInfo.limits.storage.maxFormatted;
          const percent = tierInfo.limits.storage.usagePercent;
          
          storageUsage.textContent = `${current} / ${max}`;
          storageProgress.style.width = `${percent}%`;
        }
      }
      
      // Set up upgrade button handler
      const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');
      
      if (upgradeToProBtn) {
        upgradeToProBtn.addEventListener('click', handleUpgradeClick);
      }
      
      // Set up confirmation button handler
      const confirmUpgradeBtn = document.getElementById('confirm-upgrade-btn');
      
      if (confirmUpgradeBtn) {
        confirmUpgradeBtn.addEventListener('click', handleConfirmUpgrade);
      }
    };
    
    /**
     * Handle profile form submission
     * @param {Event} event - Form submission event
     */
    const handleProfileSubmit = async (event) => {
      event.preventDefault();
      
      try {
        // Get form data
        const displayName = elements.displayName.value;
        const bio = elements.bio ? elements.bio.value : '';
        const emailNotifications = elements.emailNotifications ? elements.emailNotifications.checked : false;
        
        // Show loading state
        const saveButton = elements.saveProfileBtn;
        const saveText = document.getElementById('save-profile-text');
        const saveSpinner = document.getElementById('save-profile-spinner');
        
        if (saveButton && saveText && saveSpinner) {
          saveButton.disabled = true;
          saveText.classList.add('d-none');
          saveSpinner.classList.remove('d-none');
        }
        
        // Update profile via API
        const response = await apiService.put('/account/profile', {
          displayName,
          bio,
          emailNotifications
        });
        
        // Reset button state
        if (saveButton && saveText && saveSpinner) {
          saveButton.disabled = false;
          saveText.classList.remove('d-none');
          saveSpinner.classList.add('d-none');
        }
        
        if (response.success) {
          showSuccess('Profile updated successfully');
        } else {
          showError(response.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
        
        // Reset button state
        const saveButton = elements.saveProfileBtn;
        const saveText = document.getElementById('save-profile-text');
        const saveSpinner = document.getElementById('save-profile-spinner');
        
        if (saveButton && saveText && saveSpinner) {
          saveButton.disabled = false;
          saveText.classList.remove('d-none');
          saveSpinner.classList.add('d-none');
        }
      }
    };
    
    /**
     * Handle password form submission
     * @param {Event} event - Form submission event
     */
    const handlePasswordSubmit = async (event) => {
      event.preventDefault();
      
      try {
        // Get form data
        const currentPassword = elements.currentPassword.value;
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        // Validate passwords
        if (newPassword !== confirmPassword) {
          showError('New passwords do not match');
          return;
        }
        
        // Show loading state
        const saveButton = elements.savePasswordBtn;
        const saveText = document.getElementById('save-password-text');
        const saveSpinner = document.getElementById('save-password-spinner');
        
        if (saveButton && saveText && saveSpinner) {
          saveButton.disabled = true;
          saveText.classList.add('d-none');
          saveSpinner.classList.remove('d-none');
        }
        
        // Update password via Firebase Auth
        const user = authService.getCurrentUser();
        
        if (!user) {
          showError('You need to be logged in to change your password');
          return;
        }
        
        // Re-authenticate user before changing password
        try {
          await authService.reauthenticate(currentPassword);
          await authService.updatePassword(newPassword);
          
          // Reset form
          elements.currentPassword.value = '';
          elements.newPassword.value = '';
          elements.confirmPassword.value = '';
          
          // Reset password strength meter
          updatePasswordStrength();
          
          // Show success
          showSuccess('Password updated successfully');
        } catch (authError) {
          console.error('Error updating password:', authError);
          
          // Handle specific auth errors
          if (authError.code === 'auth/wrong-password') {
            showError('Current password is incorrect');
          } else if (authError.code === 'auth/weak-password') {
            showError('New password is too weak');
          } else {
            showError(authError.message || 'Failed to update password');
          }
        }
        
        // Reset button state
        if (saveButton && saveText && saveSpinner) {
          saveButton.disabled = false;
          saveText.classList.remove('d-none');
          saveSpinner.classList.add('d-none');
        }
      } catch (error) {
        console.error('Error in password update flow:', error);
        showError('Failed to update password');
        
        // Reset button state
        const saveButton = elements.savePasswordBtn;
        const saveText = document.getElementById('save-password-text');
        const saveSpinner = document.getElementById('save-password-spinner');
        
        if (saveButton && saveText && saveSpinner) {
          saveButton.disabled = false;
          saveText.classList.remove('d-none');
          saveSpinner.classList.add('d-none');
        }
      }
    };
    
    /**
     * Handle delete account link click
     * @param {Event} event - Click event
     */
    const handleDeleteAccountClick = (event) => {
      event.preventDefault();
      
      // Show delete account modal
      const deleteAccountModal = document.getElementById('delete-account-modal');
      
      if (deleteAccountModal) {
        const bsModal = new bootstrap.Modal(deleteAccountModal);
        bsModal.show();
      }
    };
    
    /**
     * Handle confirm delete account button click
     */
    const handleConfirmDeleteAccount = async () => {
      try {
        // Show loading state
        const confirmBtn = document.getElementById('confirm-delete-account-btn');
        
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        }
        
        // Delete account via API
        const response = await apiService.delete('/account');
        
        if (response.success) {
          // Log out user
          await authService.logout();
          
          // Redirect to landing page
          window.location.href = '#';
          
          // Show success message (via local storage to persist across page navigation)
          localStorage.setItem('account-deleted-message', 'Your account has been deleted successfully');
        } else {
          // Hide modal
          const deleteAccountModal = document.getElementById('delete-account-modal');
          if (deleteAccountModal) {
            const bsModal = bootstrap.Modal.getInstance(deleteAccountModal);
            bsModal.hide();
          }
          
          // Show error
          showError(response.message || 'Failed to delete account');
          
          // Reset button
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-user-slash me-1"></i> Delete Permanently';
          }
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        
        // Hide modal
        const deleteAccountModal = document.getElementById('delete-account-modal');
        if (deleteAccountModal) {
          const bsModal = bootstrap.Modal.getInstance(deleteAccountModal);
          bsModal.hide();
        }
        
        // Show error
        showError('Failed to delete account');
        
        // Reset button
        const confirmBtn = document.getElementById('confirm-delete-account-btn');
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<i class="fas fa-user-slash me-1"></i> Delete Permanently';
        }
      }
    };
    
    /**
     * Toggle password field visibility
     * @param {Event} event - Click event
     */
    const togglePasswordVisibility = (event) => {
      const button = event.currentTarget;
      const passwordField = button.parentElement.querySelector('input');
      
      if (!passwordField) {
        return;
      }
      
      // Toggle type between 'password' and 'text'
      const newType = passwordField.type === 'password' ? 'text' : 'password';
      passwordField.type = newType;
      
      // Toggle icon
      const icon = button.querySelector('i');
      
      if (icon) {
        icon.className = newType === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
      }
    };
    
    /**
     * Update password strength meter
     */
    const updatePasswordStrength = () => {
      if (!elements.newPassword) {
        return;
      }
      
      const password = elements.newPassword.value;
      const strengthBar = document.getElementById('password-strength-bar');
      
      if (!strengthBar) {
        return;
      }
      
      // Requirements check
      const hasLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      
      // Update requirement indicators
      const updateRequirement = (id, check) => {
        const req = document.getElementById(id);
        
        if (req) {
          const icon = req.querySelector('i');
          
          if (icon) {
            if (check) {
              icon.className = 'fas fa-check-circle text-success';
            } else {
              icon.className = 'fas fa-times-circle text-danger';
            }
          }
        }
      };
      
      updateRequirement('req-length', hasLength);
      updateRequirement('req-uppercase', hasUppercase);
      updateRequirement('req-lowercase', hasLowercase);
      updateRequirement('req-number', hasNumber);
      
      // Calculate strength percentage
      let strength = 0;
      
      if (password.length > 0) {
        // Base points
        strength += hasLength ? 25 : 0;
        strength += hasUppercase ? 25 : 0;
        strength += hasLowercase ? 25 : 0;
        strength += hasNumber ? 25 : 0;
        
        // Bonus points
        if (password.length > 12) strength += 10;
        if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 10;
        
        // Cap at 100
        strength = Math.min(strength, 100);
      }
      
      // Update strength bar
      strengthBar.style.width = `${strength}%`;
      
      // Update color based on strength
      if (strength < 40) {
        strengthBar.className = 'progress-bar bg-danger';
      } else if (strength < 70) {
        strengthBar.className = 'progress-bar bg-warning';
      } else {
        strengthBar.className = 'progress-bar bg-success';
      }
    };
    
    /**
     * Validate password match
     */
    const validatePasswordMatch = () => {
      if (!elements.newPassword || !elements.confirmPassword) {
        return;
      }
      
      const newPassword = elements.newPassword.value;
      const confirmPassword = elements.confirmPassword.value;
      const feedback = document.getElementById('password-match-feedback');
      
      if (!feedback || !confirmPassword) {
        return;
      }
      
      if (confirmPassword && newPassword !== confirmPassword) {
        feedback.textContent = 'Passwords do not match';
        feedback.className = 'form-text text-danger';
      } else if (confirmPassword) {
        feedback.textContent = 'Passwords match';
        feedback.className = 'form-text text-success';
      } else {
        feedback.textContent = '';
        feedback.className = 'form-text';
      }
    };
    
    /**
     * Send verification email
     */
    const sendVerificationEmail = async () => {
      try {
        // Show loading state
        const button = document.getElementById('send-verification-email-btn');
        
        if (button) {
          button.disabled = true;
          button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
        }
        
        // Send verification email
        await authService.sendEmailVerification();
        
        // Show success
        showSuccess('Verification email sent');
        
        // Reset button
        if (button) {
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-envelope me-2"></i> Send Verification Email';
        }
      } catch (error) {
        console.error('Error sending verification email:', error);
        
        // Show error
        showError('Failed to send verification email');
        
        // Reset button
        const button = document.getElementById('send-verification-email-btn');
        
        if (button) {
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-envelope me-2"></i> Send Verification Email';
        }
      }
    };
    
    /**
     * Handle appearance form submission
     * @param {Event} event - Form submission event
     */
    const handleAppearanceSubmit = (event) => {
      event.preventDefault();
      
      // Get form data
      const theme = document.querySelector('input[name="theme"]:checked')?.value || 'light';
      const fontSize = document.getElementById('font-size')?.value || '100';
      const primaryColor = document.querySelector('input[name="primary-color"]:checked')?.value || '#3498db';
      
      // Save to localStorage
      localStorage.setItem('app-theme', theme);
      localStorage.setItem('app-font-size', fontSize);
      localStorage.setItem('app-primary-color', primaryColor);
      
      // Apply theme immediately
      applyTheme(theme);
      applyFontSize(fontSize);
      applyPrimaryColor(primaryColor);
      
      // Show success
      showSuccess('Appearance settings saved');
    };
    
    /**
     * Handle editor preferences form submission
     * @param {Event} event - Form submission event
     */
    const handleEditorPreferencesSubmit = (event) => {
      event.preventDefault();
      
      // Get form data
      const viewMode = document.querySelector('input[name="default-view-mode"]:checked')?.value || 'edit';
      const editorFont = document.getElementById('editor-font')?.value || 'default';
      const autosaveInterval = document.getElementById('autosave-interval')?.value || '30';
      const spellCheck = document.getElementById('spell-check')?.checked || false;
      const wordCount = document.getElementById('word-count')?.checked || false;
      const lineNumbers = document.getElementById('line-numbers')?.checked || false;
      
      // Save to localStorage
      localStorage.setItem('editor-view-mode', viewMode);
      localStorage.setItem('editor-font', editorFont);
      localStorage.setItem('editor-autosave-interval', autosaveInterval);
      localStorage.setItem('editor-spell-check', spellCheck);
      localStorage.setItem('editor-word-count', wordCount);
      localStorage.setItem('editor-line-numbers', lineNumbers);
      
      // Show success
      showSuccess('Editor preferences saved');
    };
    
    /**
     * Handle notification preferences form submission
     * @param {Event} event - Form submission event
     */
    const handleNotificationPreferencesSubmit = (event) => {
      event.preventDefault();
      
      // Get form data
      const emailSecurity = document.getElementById('email-security')?.checked || false;
      const emailUpdates = document.getElementById('email-updates')?.checked || false;
      const emailTips = document.getElementById('email-tips')?.checked || false;
      const browserAutosave = document.getElementById('browser-autosave')?.checked || false;
      const browserSessionTimeout = document.getElementById('browser-session-timeout')?.checked || false;
      
      // Save to localStorage
      localStorage.setItem('notify-email-security', emailSecurity);
      localStorage.setItem('notify-email-updates', emailUpdates);
      localStorage.setItem('notify-email-tips', emailTips);
      localStorage.setItem('notify-browser-autosave', browserAutosave);
      localStorage.setItem('notify-browser-session-timeout', browserSessionTimeout);
      
      // Show success
      showSuccess('Notification preferences saved');
    };
    
    /**
     * Handle cleanup storage button click
     */
    const handleCleanupStorage = () => {
      // Show confirmation modal
      const cleanupModal = document.getElementById('cleanup-modal');
      
      if (cleanupModal) {
        const bsModal = new bootstrap.Modal(cleanupModal);
        bsModal.show();
        
        // Set up confirm button
        const confirmBtn = document.getElementById('confirm-cleanup-btn');
        
        if (confirmBtn) {
          // Remove any existing listeners
          const newBtn = confirmBtn.cloneNode(true);
          confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
          
          // Add new listener
          newBtn.addEventListener('click', confirmCleanupStorage);
        }
      }
    };
    
    /**
     * Confirm cleanup storage
     */
    const confirmCleanupStorage = async () => {
      try {
        // Show loading state
        const confirmBtn = document.getElementById('confirm-cleanup-btn');
        const buttonText = document.getElementById('cleanup-button-text');
        const spinner = document.getElementById('cleanup-spinner');
        
        if (confirmBtn && buttonText && spinner) {
          confirmBtn.disabled = true;
          buttonText.classList.add('d-none');
          spinner.classList.remove('d-none');
        }
        
        // Call cleanup API
        const response = await apiService.post('/account/cleanup-storage');
        
        // Hide modal
        const cleanupModal = document.getElementById('cleanup-modal');
        if (cleanupModal) {
          const bsModal = bootstrap.Modal.getInstance(cleanupModal);
          bsModal.hide();
        }
        
        if (response.success) {
          // Show success with details
          showSuccess(`Cleanup complete. Deleted ${response.data.filesDeleted} files and recovered ${response.data.sizeRecoveredFormatted} of storage.`);
          
          // Refresh usage data
          loadUsageData();
        } else {
          showError(response.message || 'Failed to clean up storage');
        }
        
        // Reset button
        if (confirmBtn && buttonText && spinner) {
          confirmBtn.disabled = false;
          buttonText.classList.remove('d-none');
          spinner.classList.add('d-none');
        }
      } catch (error) {
        console.error('Error cleaning up storage:', error);
        
        // Hide modal
        const cleanupModal = document.getElementById('cleanup-modal');
        if (cleanupModal) {
          const bsModal = bootstrap.Modal.getInstance(cleanupModal);
          bsModal.hide();
        }
        
        // Show error
        showError('Failed to clean up storage');
        
        // Reset button
        const confirmBtn = document.getElementById('confirm-cleanup-btn');
        const buttonText = document.getElementById('cleanup-button-text');
        const spinner = document.getElementById('cleanup-spinner');
        
        if (confirmBtn && buttonText && spinner) {
          confirmBtn.disabled = false;
          buttonText.classList.remove('d-none');
          spinner.classList.add('d-none');
        }
      }
    };
    
    /**
     * Handle upgrade button click
     */
    const handleUpgradeClick = () => {
      // Show upgrade modal
      const upgradeModal = document.getElementById('upgrade-modal');
      
      if (upgradeModal) {
        const bsModal = new bootstrap.Modal(upgradeModal);
        bsModal.show();
      }
    };
    
    /**
     * Handle confirm upgrade button click
     */
    const handleConfirmUpgrade = async () => {
      try {
        // Show loading state
        const confirmBtn = document.getElementById('confirm-upgrade-btn');
        const buttonText = document.getElementById('upgrade-button-text');
        const spinner = document.getElementById('upgrade-spinner');
        
        if (confirmBtn && buttonText && spinner) {
          confirmBtn.disabled = true;
          buttonText.classList.add('d-none');
          spinner.classList.remove('d-none');
        }
        
        // Call upgrade API
        const response = await apiService.post('/tiers/upgrade', {
          tierName: 'pro'
        });
        
        // Hide modal
        const upgradeModal = document.getElementById('upgrade-modal');
        if (upgradeModal) {
          const bsModal = bootstrap.Modal.getInstance(upgradeModal);
          bsModal.hide();
        }
        
        if (response.success) {
          // Show success
          showSuccess('Upgrade to Pro successful!');
          
          // Refresh tier data
          loadTierData();
        } else {
          showError(response.message || 'Failed to upgrade subscription');
        }
        
        // Reset button
        if (confirmBtn && buttonText && spinner) {
          confirmBtn.disabled = false;
          buttonText.classList.remove('d-none');
          spinner.classList.add('d-none');
        }
      } catch (error) {
        console.error('Error upgrading subscription:', error);
        
        // Hide modal
        const upgradeModal = document.getElementById('upgrade-modal');
        if (upgradeModal) {
          const bsModal = bootstrap.Modal.getInstance(upgradeModal);
          bsModal.hide();
        }
        
        // Show error
        showError('Failed to upgrade subscription');
        
        // Reset button
        const confirmBtn = document.getElementById('confirm-upgrade-btn');
        const buttonText = document.getElementById('upgrade-button-text');
        const spinner = document.getElementById('upgrade-spinner');
        
        if (confirmBtn && buttonText && spinner) {
          confirmBtn.disabled = false;
          buttonText.classList.remove('d-none');
          spinner.classList.add('d-none');
        }
      }
    };
    
    /**
     * Apply theme from settings
     * @param {string} theme - Theme name: 'light', 'dark', or 'system'
     */
    const applyTheme = (theme) => {
      const body = document.body;
      
      // Remove any existing theme classes
      body.classList.remove('theme-light', 'theme-dark');
      
      if (theme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      } else {
        // Apply specified theme
        body.classList.add(`theme-${theme}`);
      }
    };
    
    /**
     * Apply font size from settings
     * @param {string} size - Font size percentage
     */
    const applyFontSize = (size) => {
      document.documentElement.style.fontSize = `${size}%`;
    };
    
    /**
     * Apply primary color from settings
     * @param {string} color - Primary color hex code
     */
    const applyPrimaryColor = (color) => {
      document.documentElement.style.setProperty('--primary-color', color);
      
      // Set derived colors
      const derivePrimaryDark = (color) => {
        // Convert hex to RGB
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        
        // Make darker (multiply by 0.8)
        const rDark = Math.floor(r * 0.8);
        const gDark = Math.floor(g * 0.8);
        const bDark = Math.floor(b * 0.8);
        
        // Convert back to hex
        return `#${rDark.toString(16).padStart(2, '0')}${gDark.toString(16).padStart(2, '0')}${bDark.toString(16).padStart(2, '0')}`;
      };
      
      const derivePrimaryLight = (color) => {
        // Convert hex to RGB
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        
        // Make lighter (mix with white)
        const rLight = Math.min(255, Math.floor(r + (255 - r) * 0.85));
        const gLight = Math.min(255, Math.floor(g + (255 - g) * 0.85));
        const bLight = Math.min(255, Math.floor(b + (255 - b) * 0.85));
        
        // Convert back to hex
        return `#${rLight.toString(16).padStart(2, '0')}${gLight.toString(16).padStart(2, '0')}${bLight.toString(16).padStart(2, '0')}`;
      };
      
      document.documentElement.style.setProperty('--primary-dark', derivePrimaryDark(color));
      document.documentElement.style.setProperty('--primary-light', derivePrimaryLight(color));
    };
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    const showSuccess = (message) => {
      // Determine which alert to show based on current page
      let successAlert;
      
      if (window.location.hash === '#account/profile') {
        successAlert = document.getElementById('profile-success-alert');
        
        if (successAlert) {
          const successMessage = document.getElementById('profile-success-message');
          
          if (successMessage) {
            successMessage.textContent = message;
          }
          
          successAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            successAlert.classList.add('d-none');
          }, 5000);
        }
      } else if (window.location.hash === '#account/security') {
        successAlert = document.getElementById('security-success-alert');
        
        if (successAlert) {
          const successMessage = document.getElementById('security-success-message');
          
          if (successMessage) {
            successMessage.textContent = message;
          }
          
          successAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            successAlert.classList.add('d-none');
          }, 5000);
        }
      } else if (window.location.hash === '#account/tier') {
        successAlert = document.getElementById('tier-success-alert');
        
        if (successAlert) {
          const successMessage = document.getElementById('tier-success-message');
          
          if (successMessage) {
            successMessage.textContent = message;
          }
          
          successAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            successAlert.classList.add('d-none');
          }, 5000);
        }
      } else if (window.location.hash === '#account/preferences') {
        successAlert = document.getElementById('preferences-success-alert');
        
        if (successAlert) {
          const successMessage = document.getElementById('preferences-success-message');
          
          if (successMessage) {
            successMessage.textContent = message;
          }
          
          successAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            successAlert.classList.add('d-none');
          }, 5000);
        }
      }
      
      // Fallback to toast notification
      if (!successAlert) {
        showToast(message, 'success');
      }
    };
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    const showError = (message) => {
      // Determine which alert to show based on current page
      let errorAlert;
      
      if (window.location.hash === '#account/profile') {
        errorAlert = document.getElementById('profile-error-alert');
        
        if (errorAlert) {
          const errorMessage = document.getElementById('profile-error-message');
          
          if (errorMessage) {
            errorMessage.textContent = message;
          }
          
          errorAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            errorAlert.classList.add('d-none');
          }, 5000);
        }
      } else if (window.location.hash === '#account/security') {
        errorAlert = document.getElementById('security-error-alert');
        
        if (errorAlert) {
          const errorMessage = document.getElementById('security-error-message');
          
          if (errorMessage) {
            errorMessage.textContent = message;
          }
          
          errorAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            errorAlert.classList.add('d-none');
          }, 5000);
        }
      } else if (window.location.hash === '#account/tier') {
        errorAlert = document.getElementById('tier-error-alert');
        
        if (errorAlert) {
          const errorMessage = document.getElementById('tier-error-message');
          
          if (errorMessage) {
            errorMessage.textContent = message;
          }
          
          errorAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            errorAlert.classList.add('d-none');
          }, 5000);
        }
      } else if (window.location.hash === '#account/preferences') {
        errorAlert = document.getElementById('preferences-error-alert');
        
        if (errorAlert) {
          const errorMessage = document.getElementById('preferences-error-message');
          
          if (errorMessage) {
            errorMessage.textContent = message;
          }
          
          errorAlert.classList.remove('d-none');
          
          // Hide after delay
          setTimeout(() => {
            errorAlert.classList.add('d-none');
          }, 5000);
        }
      }
      
      // Fallback to toast notification
      if (!errorAlert) {
        showToast(message, 'error');
      }
    };
    
    /**
     * Show toast notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type: 'success', 'error', 'info', 'warning'
     */
    const showToast = (message, type = 'info') => {
      // Check if showToast is available globally
      if (typeof window.showToast === 'function') {
        window.showToast(message, type);
      } else {
        // Fallback alert if toast function not available
        if (type === 'error') {
          alert(`Error: ${message}`);
        } else {
          alert(message);
        }
      }
    };
    
    // Public API
    return {
      init
    };
  })();
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize account service
    accountService.init();
    
    // Initialize on hash change to handle navigation between account pages
    window.addEventListener('hashchange', () => {
      if (window.location.hash.startsWith('#account')) {
        accountService.init();
      }
    });
  });