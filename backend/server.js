/**
 * Notes App Backend - Main Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const moduleRoutes = require('./routes/modules');
const noteRoutes = require('./routes/notes');
const tagRoutes = require('./routes/tags');
const imageRoutes = require('./routes/images');

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();

// Define port
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded request bodies

// Set security headers
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`, { 
    ip: req.ip, 
    userAgent: req.headers['user-agent'] 
  });
  next();
});

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/images', imageRoutes);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Home route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Notes App API is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`API available at http://localhost:${PORT}/api`);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Give the logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

// Handle process termination signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  // Close server connections and exit gracefully
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully');
  // Close server connections and exit gracefully
  process.exit(0);
});

module.exports = app; // Export for testing