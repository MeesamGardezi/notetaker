/**
 * Server entry point
 */

const app = require('./server/app');
const config = require('./server/config/config');

// Start the server
const server = app.listen(config.server.port, config.server.host, () => {
  console.log(`Server running on http://${config.server.host}:${config.server.port}`);
  console.log(`Environment: ${config.environment}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  
  // Gracefully close server before exiting
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  
  // Forcefully exit (uncaught exceptions make app in unpredictable state)
  process.exit(1);
});

// Handle SIGTERM signal (e.g., Heroku shutdown)
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  
  server.close(() => {
    console.log('Process terminated');
  });
});