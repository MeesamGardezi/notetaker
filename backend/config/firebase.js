/**
 * Firebase configuration and initialization
 * This file initializes and exports Firebase services
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Initialize service account based on what's provided in environment
let serviceAccount;

// Method 1: Base64-encoded service account JSON in environment variable
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString();
    serviceAccount = JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse Firebase service account from environment variable:', error);
    process.exit(1);
  }
} 
// Method 2: Path to service account JSON file
else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const filePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(filePath)) {
      console.error(`Firebase service account file not found at: ${filePath}`);
      process.exit(1);
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    serviceAccount = JSON.parse(fileContent);
  } catch (error) {
    console.error('Failed to load Firebase service account from file:', error);
    process.exit(1);
  }
} 
// Error if neither is provided
else {
  console.error('Firebase service account is not defined in environment variables');
  console.error('Please set either FIREBASE_SERVICE_ACCOUNT (base64 encoded) or FIREBASE_SERVICE_ACCOUNT_PATH');
  process.exit(1);
}

// Check for storage bucket
if (!process.env.FIREBASE_STORAGE_BUCKET) {
  console.error('FIREBASE_STORAGE_BUCKET is not defined in environment variables');
  process.exit(1);
}

// Initialize the Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

// Initialize Firestore
const db = admin.firestore();
// Enable Firestore timestamp settings
db.settings({ timestampsInSnapshots: true });

// Initialize Firebase Storage
const bucket = admin.storage().bucket();

// Export initialized Firebase services
module.exports = {
  admin,
  db,
  bucket,
  
  // Collection references for easier use throughout the app
  collections: {
    users: db.collection('users'),
    modules: db.collection('modules'),
    notes: db.collection('notes'),
    tags: db.collection('tags'),
    noteImages: db.collection('noteImages'),
    
    // Add Firestore field values for convenience
    FieldValue: admin.firestore.FieldValue,
    Timestamp: admin.firestore.Timestamp
  },
  
  // Firebase field values
  FieldValue: admin.firestore.FieldValue,
  Timestamp: admin.firestore.Timestamp
};