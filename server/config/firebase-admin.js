/**
 * Firebase Admin SDK configuration
 * Used for backend operations with Firebase services
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * @returns {Object} - Firebase Admin SDK instance
 */
const initializeFirebaseAdmin = () => {
  // Check if Firebase Admin SDK is already initialized
  if (admin.apps.length > 0) {
    console.log('Firebase Admin SDK already initialized');
    return {
      admin,
      db: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage()
    };
  }

  try {
    let serviceAccount = null;
    
    // Try different methods to get service account credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // From environment variable
      console.log('Initializing Firebase Admin SDK with service account from environment variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // From file
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      console.log(`Initializing Firebase Admin SDK with service account from file: ${serviceAccountPath}`);
      
      try {
        // Check if file exists
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = require(path.resolve(serviceAccountPath));
        } else {
          console.warn(`Service account file not found at ${serviceAccountPath}`);
        }
      } catch (fileError) {
        console.error('Error reading service account file:', fileError);
      }
    }
    
    // Initialize with service account if available
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      
      console.log('Firebase Admin SDK initialized with service account');
    } else {
      // Otherwise, try to initialize with environment variables or application default credentials
      console.log('No service account found, initializing Firebase Admin SDK with default credentials');
      
      const firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      };
      
      admin.initializeApp(firebaseConfig);
      
      console.log('Firebase Admin SDK initialized with application default credentials');
    }
    
    // Return instances of services
    return {
      admin,
      db: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage()
    };
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
};

// Initialize Firebase Admin SDK
const firebaseAdmin = initializeFirebaseAdmin();

// Export the admin instance and services
module.exports = firebaseAdmin;