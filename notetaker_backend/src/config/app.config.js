/**
 * Application Configuration
 * General application settings and environment-specific configuration
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
    uploads: path.resolve(__dirname, '../../uploads')
  },
  
  // JWT configuration for authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'your-strong-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // API rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
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
    ],
    destination: path.resolve(__dirname, '../../uploads')
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  }
};

// Environment-specific configurations
const environmentConfigs = {
  development: {
    // Development-specific overrides
    logging: {
      level: 'debug'
    }
  },
  
  test: {
    // Test-specific overrides
    server: {
      port: 3001
    },
    jwt: {
      secret: 'test-secret-key',
      expiresIn: '1h'
    },
    logging: {
      level: 'error'
    }
  },
  
  production: {
    // Production-specific overrides
    server: {
      host: process.env.HOST || '0.0.0.0'
    },
    logging: {
      level: 'error'
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