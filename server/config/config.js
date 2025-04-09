/**
 * Application configuration
 * This file contains general configuration settings for the application
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define environment
const environment = process.env.NODE_ENV || 'development';

// Base configuration object
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // Application paths
  paths: {
    root: path.resolve(__dirname, '../../'),
    public: path.resolve(__dirname, '../../public'),
    views: path.resolve(__dirname, '../../views')
  },
  
  // JWT configuration for authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'strongkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Tier limitations
  tiers: {
    free: {
      maxModules: 2,
      maxNotesPerModule: 10,
      maxStorage: 52428800, // 50MB in bytes
      features: ['basic_editor']
    },
    pro: {
      maxModules: Infinity,
      maxNotesPerModule: Infinity,
      maxStorage: 5368709120, // 5GB in bytes
      features: ['basic_editor', 'advanced_editor', 'export', 'offline_access', 'collaboration']
    }
  },
  
  // Upload configuration
  upload: {
    maxFileSize: 10485760, // 10MB in bytes
    allowedMimeTypes: [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

// Environment-specific configurations
const environmentConfigs = {
  development: {
    // Development-specific overrides
  },
  
  test: {
    // Test-specific overrides
    server: {
      port: 3001
    },
    jwt: {
      secret: 'strongkey',
      expiresIn: '1h'
    }
  },
  
  production: {
    // Production-specific overrides
    server: {
      host: process.env.HOST || '0.0.0.0'
    }
  }
};

// Merge environment-specific configuration with base configuration
const mergedConfig = {
  ...config,
  ...(environmentConfigs[environment] || {})
};

module.exports = {
  ...mergedConfig,
  environment
};