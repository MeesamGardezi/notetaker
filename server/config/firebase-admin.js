/**
 * Firebase Admin SDK configuration
 * Used for backend operations with Firebase services
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if Firebase Admin SDK is already initialized
if (!admin.apps.length) {
  // Initialize the Firebase Admin SDK with service account credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Use service account credentials from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Use service account credentials from file
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } else {
    // If no service account is provided, initialize with application default credentials
    // This is useful for local development with Firebase Emulator Suite
    admin.initializeApp({
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }
}

// Export the admin instance
module.exports = {
  admin,
  db: admin.firestore(),
  auth: admin.auth(),
  storage: admin.storage()
};