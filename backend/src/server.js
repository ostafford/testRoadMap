// ReMap Backend Server

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
require('dotenv').config();

// Create Express application instance
const app = express();

// Configuration from environment variables with sensible defaults
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'remap_dev',
    user: process.env.DB_USER || 'remap_user',
    password: process.env.DB_PASSWORD || 'dev_password'
  }
};

// Create PostgreSQL connection pool for efficient database operations
// Connection pooling reuses database connections instead of creating new ones for each request
const pool = new Pool(config.database);

// Test database connection on startup to catch configuration issues early
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
    console.error('📋 Database configuration:', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user
    });
  } else {
    console.log('✅ Successfully connected to PostgreSQL database');
    console.log(`📊 Database: ${config.database.database} on ${config.database.host}:${config.database.port}`);
    release(); // Release the test connection back to the pool
  }
});

// Middleware Setup
// These middleware functions process every request before it reaches our route handlers

// Security middleware - adds various HTTP headers to protect against common attacks
app.use(helmet());

// CORS middleware - allows our React Native app to make requests to this API
// In development, we allow all origins for convenience
app.use(cors({
  origin: config.nodeEnv === 'development' ? '*' : [], // TODO: Configure specific origins for production
  credentials: true
}));

// Request logging middleware - logs all HTTP requests for debugging and monitoring
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Body parsing middleware - allows us to read JSON data from request bodies
app.use(express.json({ limit: '10mb' })); // Set reasonable limit for image uploads later
app.use(express.urlencoded({ extended: true }));

// Route Handlers
// These endpoints define our API surface that the React Native app will interact with

// Health check endpoint - used by Docker and monitoring tools to verify service status
app.get('/health', async (req, res) => {
  try {
    // Test database connectivity as part of health check
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: {
        connected: true,
        current_time: result.rows[0].current_time,
        version: result.rows[0].postgres_version.split(' ')[0] // Extract just the version number
      },
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      uptime: process.uptime()
    });
  }
});

// API root endpoint - provides basic information about the API
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to ReMap API',
    version: '1.0.0',
    description: 'Your Interactive Memory Atlas API',
    endpoints: {
      health: '/health',
      api_info: '/api'
    },
    documentation: 'Coming soon - this is where API docs will live'
  });
});

// Placeholder route for future memory-related endpoints
// This demonstrates the structure that Nigel and Lachlan can expand upon
app.get('/api/memories', async (req, res) => {
  try {
    // This is a placeholder that demonstrates database querying
    // In the future, this will return actual memory data based on location, user, etc.
    const result = await pool.query('SELECT NOW() as timestamp');
    
    res.json({
      message: 'Memories endpoint - ready for implementation',
      timestamp: result.rows[0].timestamp,
      // Future: This will contain actual memory data
      memories: [],
      count: 0,
      note: 'This endpoint is ready for Nigel and Lachlan to implement the full memory logic'
    });
  } catch (error) {
    console.error('Error in memories endpoint:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Database query failed'
    });
  }
});

// Error handling middleware - catches any unhandled errors and returns appropriate responses
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    available_endpoints: ['/health', '/api', '/api/memories']
  });
});

// Start the server
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ReMap Backend Server Started');
  console.log('================================');
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Server URL: http://localhost:${config.port}`);
  console.log(`💾 Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  🏥 Health Check: http://localhost:${config.port}/health`);
  console.log(`  📊 API Info: http://localhost:${config.port}/api`);
  console.log(`  💭 Memories: http://localhost:${config.port}/api/memories`);
  console.log('');
  console.log('Ready for development! 🎉');
});

// Graceful shutdown handling - ensures clean cleanup when the server stops
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    // Close database connection pool
    try {
      await pool.end();
      console.log('✅ Database connections closed');
    } catch (error) {
      console.error('❌ Error closing database connections:', error.message);
    }
    
    console.log('👋 Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('⏰ Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));