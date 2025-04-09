const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config/config');
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const moduleRoutes = require('./routes/module.routes');
const noteRoutes = require('./routes/note.routes');
const mediaRoutes = require('./routes/media.routes');
const tierRoutes = require('./routes/tier.routes');

// Create Express app
const app = express();

// Enable compression early in the pipeline
app.use(compression());

// Disable helmet's restrictive policies for development convenience
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// CORS configuration - keep it permissive
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request logging
if (config.environment !== 'test') {
  app.use(morgan(config.environment === 'development' ? 'dev' : 'combined'));
}

// CRITICAL: Serve static files with proper MIME types
// This must come BEFORE any API routes or middleware that might catch these requests
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.js') {
      res.set('Content-Type', 'application/javascript');
    } else if (ext === '.css') {
      res.set('Content-Type', 'text/css');
    } else if (ext === '.html') {
      res.set('Content-Type', 'text/html');
    } else if (ext === '.json') {
      res.set('Content-Type', 'application/json');
    }
  }
}));

// Parse cookies
app.use(cookieParser());

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/tiers', tierRoutes);

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// 404 handler for API routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;