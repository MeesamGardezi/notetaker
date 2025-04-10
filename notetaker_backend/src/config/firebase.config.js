/**
 * Firebase Configuration
 * Handles Firebase initialization and service exports
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * @returns {Object} Firebase services
 */
const initializeFirebase = () => {
  // Check if Firebase Admin SDK is already initialized
  if (admin.apps.length > 0) {
    console.log('Firebase Admin SDK already initialized');
    return getFirebaseServices();
  }

  try {
    // Initialize with service account if available
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // From environment variable (JSON string)
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // From JSON file
      serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin SDK initialized with service account');
    } else {
      // Initialize with application default credentials
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log('Firebase Admin SDK initialized with application default credentials');
    }

    return getFirebaseServices();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
};

/**
 * Get Firebase services
 * @returns {Object} Firebase services
 */
const getFirebaseServices = () => {
  return {
    admin,
    auth: admin.auth(),
    db: admin.firestore(),
    storage: admin.storage()
  };
};

/**
 * Get Firebase client configuration (for frontend)
 * @returns {Object} Firebase client config
 */
const getClientConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
};

module.exports = {
  initializeFirebase,
  getFirebaseServices,
  getClientConfig
};