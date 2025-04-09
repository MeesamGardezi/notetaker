/**
 * Firebase Initialization
 * This file initializes Firebase services for the client
 */

// Function to fetch Firebase configuration from the server
const fetchFirebaseConfig = async () => {
    try {
      console.log('Fetching Firebase configuration from server...');
      const response = await fetch('/api/auth/firebase-config');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Firebase configuration: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Firebase config API response:', { ...result, data: result.data ? { ...result.data, apiKey: '***HIDDEN***' } : null });
      
      if (result.success && result.data) {
        // Validate the configuration has all required fields
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
        const missingFields = requiredFields.filter(field => !result.data[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Firebase config missing required fields: ${missingFields.join(', ')}`);
        }
        
        return result.data;
      }
      
      throw new Error('Invalid configuration format received from server');
    } catch (error) {
      console.error('Error fetching Firebase configuration:', error);
      
      // Fallback to hardcoded config with placeholders
      // IMPORTANT: For production, set proper environment variables instead!
      console.warn('Using fallback Firebase configuration. Replace with actual values for production!');
      
      // This approach is for development/debugging only
      return {
        apiKey: "AIzaSyCs0a__R7PJjbCRc5nmVriTm7jIaxgHTY8", // Replace with actual Firebase API key
        authDomain: "degree-notes-3617b.firebaseapp.com",
        projectId: "degree-notes-3617b",
        storageBucket: "degree-notes-3617b.appspot.com",
        messagingSenderId: "476328566101", // Replace with actual sender ID
        appId: "1:476328566101:web:bebc3bec7a1f4b0fc4f7b2" // Replace with actual app ID
      };
    }
  };
  
  // Initialize Firebase
  let firebaseApp = null;
  let firebaseAuth = null;
  let firebaseFirestore = null;
  let firebaseStorage = null;
  
  const initializeFirebase = async () => {
    try {
      // Only initialize Firebase once
      if (firebaseApp) {
        console.log('Firebase already initialized, reusing existing instance');
        return {
          app: firebaseApp,
          auth: firebaseAuth,
          firestore: firebaseFirestore,
          storage: firebaseStorage
        };
      }
  
      // Fetch configuration
      const config = await fetchFirebaseConfig();
      console.log('Firebase config to use:', { ...config, apiKey: '***HIDDEN***' });
      
      // Check if we have a valid API key
      if (!config.apiKey || config.apiKey === 'your-firebase-api-key') {
        throw new Error('Invalid Firebase API key. Please set a valid key in your configuration.');
      }
      
      // Initialize Firebase app
      console.log('Initializing Firebase app...');
      firebaseApp = firebase.initializeApp(config);
      
      // Initialize Firebase services
      console.log('Initializing Firebase auth...');
      firebaseAuth = firebase.auth();
      
      console.log('Initializing Firebase firestore...');
      firebaseFirestore = firebase.firestore();
      
      console.log('Initializing Firebase storage...');
      firebaseStorage = firebase.storage();
      
      // Configure Firestore
      firebaseFirestore.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
      });
      
      // Enable offline persistence if browser supports it
      try {
        console.log('Enabling Firestore persistence...');
        await firebaseFirestore.enablePersistence({
          synchronizeTabs: true
        });
        console.log('Firestore persistence enabled successfully');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support offline persistence.');
        } else {
          console.warn('Firestore persistence error:', err);
        }
      }
      
      console.log('Firebase initialized successfully');
      
      return {
        app: firebaseApp,
        auth: firebaseAuth,
        firestore: firebaseFirestore,
        storage: firebaseStorage
      };
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  };
  
  // Initialize Firebase when the page loads
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      console.log('Attempting to initialize Firebase on page load...');
      await initializeFirebase();
    } catch (error) {
      console.error('Failed to initialize Firebase on page load:', error);
    }
  });
  
  // Export Firebase instance and initialization function
  window.firebaseInit = {
    initialize: initializeFirebase,
    getServices: () => ({
      app: firebaseApp,
      auth: firebaseAuth,
      firestore: firebaseFirestore,
      storage: firebaseStorage
    })
  };