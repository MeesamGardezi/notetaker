/**
 * Authentication Service
 * Handles user authentication and session management
 */

// Auth Service object
const authService = (() => {
    // Private variables
    let currentUser = null;
    let isAuthenticated = false;
    let authListeners = [];
    
    // Get Firebase services
    const getFirebaseServices = () => {
      const services = window.firebaseInit.getServices();
      if (!services.auth) {
        throw new Error('Firebase Auth not initialized');
      }
      return services;
    };
    
    /**
     * Initialize authentication service
     * @returns {Promise<void>}
     */
    const init = async () => {
      try {
        // Initialize Firebase if not already initialized
        await window.firebaseInit.initialize();
        
        const { auth } = getFirebaseServices();
        
        // Set up authentication state change listener
        auth.onAuthStateChanged((user) => {
          if (user) {
            handleAuthStateChange(user);
          } else {
            handleSignOut();
          }
        });
        
        // Check if user is already authenticated - this is optional
        try {
          await verifyToken();
        } catch (error) {
          // If verification fails with 401, this is expected when not logged in
          if (error.message && error.message.includes('Authentication required')) {
            console.log('No active session found, user needs to log in');
          } else {
            // For other errors, log but don't throw
            console.warn('Token verification issue:', error.message);
          }
          // Ensure we're in a signed-out state
          handleSignOut();
        }
        
      } catch (error) {
        console.error('Failed to initialize auth service:', error);
        handleSignOut();
      }
    };
    
    /**
     * Handle authentication state change
     * @param {Object} user - Firebase user object
     */
    const handleAuthStateChange = async (user) => {
      try {
        // Get ID token
        const idToken = await user.getIdToken();
        
        // Verify token with backend
        const response = await apiService.post('/auth/verify-token', { token: idToken });
        
        if (response.success) {
          currentUser = response.data.user;
          isAuthenticated = true;
          notifyListeners();
        } else {
          handleSignOut();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        handleSignOut();
      }
    };
    
    /**
     * Handle sign out
     */
    const handleSignOut = () => {
      currentUser = null;
      isAuthenticated = false;
      notifyListeners();
    };
    
    /**
     * Verify authentication token with server
     * @returns {Promise<boolean>} - Whether token is valid
     */
    const verifyToken = async () => {
      try {
        const response = await apiService.get('/auth/verify-token');
        
        if (response.success) {
          currentUser = response.data.user;
          isAuthenticated = true;
          notifyListeners();
          return true;
        }
        
        return false;
      } catch (error) {
        console.log('Token verification failed:', error);
        handleSignOut();
        throw error; // Re-throw so caller can handle it
      }
    };
    
    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} displayName - User display name
     * @returns {Promise<Object>} - Registration result
     */
    const register = async (email, password, displayName) => {
      try {
        const response = await apiService.post('/auth/register', {
          email,
          password,
          displayName
        });
        
        if (response.success) {
          // Login after successful registration
          return login(email, password);
        }
        
        return response;
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    };
    
    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - Login result
     */
    const login = async (email, password) => {
      try {
        const response = await apiService.post('/auth/login', {
          email,
          password
        });
        
        if (response.success) {
          currentUser = response.data.user;
          isAuthenticated = true;
          notifyListeners();
        }
        
        return response;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    };
    
    /**
     * Login user with Google
     * @returns {Promise<Object>} - Login result
     */
    const loginWithGoogle = async () => {
      try {
        const { auth } = getFirebaseServices();
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Sign in with Google
        const userCredential = await auth.signInWithPopup(provider);
        
        // Get ID token
        const idToken = await userCredential.user.getIdToken();
        
        // Verify with backend
        const response = await apiService.post('/auth/login-google', {
          idToken
        });
        
        if (response.success) {
          currentUser = response.data.user;
          isAuthenticated = true;
          notifyListeners();
        }
        
        return response;
      } catch (error) {
        console.error('Google login failed:', error);
        throw error;
      }
    };
    
    /**
     * Logout user
     * @returns {Promise<Object>} - Logout result
     */
    const logout = async () => {
      try {
        const { auth } = getFirebaseServices();
        
        // Sign out from Firebase
        await auth.signOut();
        
        // Sign out from backend
        const response = await apiService.get('/auth/logout');
        
        handleSignOut();
        
        return response;
      } catch (error) {
        console.error('Logout failed:', error);
        
        // Still sign out locally
        handleSignOut();
        
        throw error;
      }
    };
    
    /**
     * Request password reset email
     * @param {string} email - User email
     * @returns {Promise<Object>} - Result
     */
    const requestPasswordReset = async (email) => {
      try {
        return await apiService.post('/auth/reset-password', { email });
      } catch (error) {
        console.error('Password reset request failed:', error);
        throw error;
      }
    };
    
    /**
     * Get current user
     * @returns {Object|null} - Current user or null if not authenticated
     */
    const getCurrentUser = () => {
      return currentUser;
    };
    
    /**
     * Check if user is authenticated
     * @returns {boolean} - Whether user is authenticated
     */
    const getIsAuthenticated = () => {
      return isAuthenticated;
    };
    
    /**
     * Add authentication state change listener
     * @param {Function} listener - Callback function
     */
    const addAuthListener = (listener) => {
      if (typeof listener === 'function' && !authListeners.includes(listener)) {
        authListeners.push(listener);
      }
    };
    
    /**
     * Remove authentication state change listener
     * @param {Function} listener - Callback function to remove
     */
    const removeAuthListener = (listener) => {
      const index = authListeners.indexOf(listener);
      if (index !== -1) {
        authListeners.splice(index, 1);
      }
    };
    
    /**
     * Notify all listeners of authentication state change
     */
    const notifyListeners = () => {
      const authState = {
        user: currentUser,
        isAuthenticated
      };
      
      authListeners.forEach(listener => {
        try {
          listener(authState);
        } catch (error) {
          console.error('Auth listener error:', error);
        }
      });
    };
    
    // Public API
    return {
      init,
      register,
      login,
      loginWithGoogle,
      logout,
      requestPasswordReset,
      getCurrentUser,
      getIsAuthenticated,
      addAuthListener,
      removeAuthListener,
      verifyToken
    };
  })();
  
  // Initialize auth service when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    authService.init().catch(error => {
      console.error('Auth initialization failed:', error);
    });
  });
  
  // Make auth service available globally
  window.authService = authService;