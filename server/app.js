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

// Set security headers but completely disable restrictive policies
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// Set proper MIME types for specific file extensions
app.use((req, res, next) => {
  const url = req.url.split('?')[0];
  const ext = path.extname(url).toLowerCase();
  
  if (ext === '.js') {
    res.type('application/javascript');
  } else if (ext === '.css') {
    res.type('text/css');
  }
  
  next();
});

// Enable compression
app.use(compression());

// IMPORTANT: Serve static files BEFORE parsers and other middleware
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.extname(filePath) === '.css') {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// Enable CORS - make it very permissive
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

// Serve index.html for all other routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;