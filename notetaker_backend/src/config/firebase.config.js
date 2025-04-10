/**
 * Firebase Configuration
 * Handles Firebase initialization and service exports
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Global variables to store initialized services
let firebaseAdmin = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

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
      console.log('Using Firebase service account from environment variable');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // From JSON file
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      try {
        // Check if file exists
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = require(path.resolve(serviceAccountPath));
          console.log(`Using Firebase service account from file: ${serviceAccountPath}`);
        } else {
          console.warn(`Service account file not found at ${serviceAccountPath}`);
          
          // Try using the service account from the repository root
          const repoServiceAccountPath = path.resolve(__dirname, '../../firebase_service.json');
          if (fs.existsSync(repoServiceAccountPath)) {
            serviceAccount = require(repoServiceAccountPath);
            console.log(`Using Firebase service account from repository: ${repoServiceAccountPath}`);
          }
        }
      } catch (err) {
        console.error('Error loading service account file:', err);
      }
    } else {
      // Try using the service account from the repository root as a fallback
      const repoServiceAccountPath = path.resolve(__dirname, '../../firebase_service.json');
      if (fs.existsSync(repoServiceAccountPath)) {
        serviceAccount = require(repoServiceAccountPath);
        console.log(`Using Firebase service account from repository: ${repoServiceAccountPath}`);
      }
    }

    if (serviceAccount) {
      // Initialize with service account
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin SDK initialized with service account');
    } else {
      // Initialize with application default credentials
      firebaseAdmin = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log('Firebase Admin SDK initialized with application default credentials');
    }

    // Initialize services
    firebaseAuth = admin.auth();
    firebaseDb = admin.firestore();
    firebaseStorage = admin.storage();

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
  // Check if services are initialized
  if (!firebaseAdmin || !firebaseAuth || !firebaseDb || !firebaseStorage) {
    // Initialize if not already done
    initializeFirebase();
  }
  
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