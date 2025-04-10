/**
 * Application entry point
 * Initializes Firebase and starts the Express server
 */

const app = require('./app');
const config = require('./config/app.config');
const { initializeFirebase } = require('./config/firebase.config');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Check for required files
const requiredFiles = () => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../firebase_service.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.warn(`Warning: Firebase service account file not found at ${serviceAccountPath}`);
    console.warn('You might encounter issues with Firebase services');
  }
  
  if (!fs.existsSync(path.resolve(__dirname, '../.env'))) {
    console.warn('Warning: .env file not found. Using environment variables or defaults');
  }
};

// Check required files
requiredFiles();

// Set port from environment or config
const PORT = process.env.PORT || config.server.port;

// Initialize Firebase before starting the server
console.log('Initializing Firebase...');
initializeFirebase()
  .then(() => {
    console.log('Firebase initialized successfully');
    
    // Start the Express server
    const server = app.listen(PORT, () => {
      console.log(`NoteTaker API server running on port ${PORT} in ${config.environment} mode`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      // Don't exit the server in development mode
      if (config.environment === 'production') {
        console.log('Shutting down server due to unhandled promise rejection');
        server.close(() => process.exit(1));
      }
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      // Don't exit the server in development mode
      if (config.environment === 'production') {
        console.log('Shutting down server due to uncaught exception');
        server.close(() => process.exit(1));
      }
    });
    
    // Handle server shutdown signals
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        console.log(`${signal} received, shutting down gracefully`);
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    });
  })
  .catch(error => {
    console.error('Failed to initialize Firebase:', error);
    process.exit(1);
  });