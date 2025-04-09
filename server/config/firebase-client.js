/**
 * Firebase Client SDK configuration
 * This configuration will be shared with the frontend
 * IMPORTANT: Only include public API keys here, never include anything sensitive
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Firebase configuration object for the client-side SDK
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Function to get Firebase client configuration
// This can be used to safely pass the configuration to the frontend
const getFirebaseClientConfig = () => {
  return firebaseConfig;
};

module.exports = {
  firebaseConfig,
  getFirebaseClientConfig
};