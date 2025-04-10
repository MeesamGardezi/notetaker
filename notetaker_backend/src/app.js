/**
 * Main Express application setup
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./config/app.config');
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const moduleRoutes = require('./routes/module.routes');
const noteRoutes = require('./routes/note.routes');
const mediaRoutes = require('./routes/media.routes');

// Create Express app
const app = express();

// Enable compression
app.use(compression());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: true
}));

// Request logging
if (config.environment !== 'test') {
  app.use(morgan(config.logging.format));
}

// Parse cookies
app.use(cookieParser());

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/media', mediaRoutes);

// Static files
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app in production
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // All unhandled requests should serve index.html for React router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // API documentation in development
  app.get('/', (req, res) => {
    res.send('NoteTaker API - Documentation will be available here');
  });
}

// 404 error handler for API routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;