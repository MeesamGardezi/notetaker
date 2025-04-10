/**
 * Firebase Client SDK configuration
 * This configuration will be shared with the frontend
 * IMPORTANT: Only include public API keys here, never include anything sensitive
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Validate Firebase client configuration
 * @param {Object} config - Firebase configuration object
 * @returns {boolean} - Whether configuration is valid
 */
const validateFirebaseConfig = (config) => {
  // Required fields for client config
  const requiredFields = [
    'apiKey', 
    'authDomain', 
    'projectId', 
    'storageBucket', 
    'messagingSenderId', 
    'appId'
  ];
  
  // Check all required fields exist and are not empty
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Firebase client config is missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  // Check if apiKey seems valid (at least 20 chars)
  if (config.apiKey === 'AIzaSyCs0a__R7PJjbCRc5nmVriTm7jIaxgHTY8' || 
      config.apiKey.length < 20 || 
      config.apiKey.includes('your-')) {
    console.warn('Firebase API key seems invalid or missing');
    return false;
  }
  
  return true;
};

// Firebase configuration object for the client-side SDK
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL
};

// Validate the configuration
const isConfigValid = validateFirebaseConfig(firebaseConfig);

if (!isConfigValid) {
  console.warn('Firebase client configuration is invalid or incomplete. Please check your .env file.');
}

/**
 * Get Firebase client configuration
 * This can be used to safely pass the configuration to the frontend
 * @returns {Object} - Firebase client configuration
 */
const getFirebaseClientConfig = () => {
  return firebaseConfig;
};

module.exports = {
  firebaseConfig,
  getFirebaseClientConfig,
  isConfigValid
};