const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { pool } = require('./config/database');
const { startCleanupJob } = require('./jobs/cleanupMessages');
const socketManager = require('./socket');

// โหลด environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket.IO instance
socketManager.init(io);

// Middleware - Enhanced Security Headers
app.use(helmet({
  // Content Security Policy (prevents XSS)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // HTTP Strict Transport Security (force HTTPS in production)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // Prevent MIME sniffing
  noSniff: true,
  
  // Disable X-Powered-By header
  hidePoweredBy: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// Additional custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  
  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Add limit to prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files สำหรับอัพโหลด
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ทดสอบการเชื่อมต่อ PostgreSQL
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ PostgreSQL connected at:', res.rows[0].now);
  }
});

// Socket.IO setup
require('./sockets/chatSocket')(io);

// Initialize Socket.IO in chat controller
const chatController = require('./controllers/chatController');
chatController.setIO(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/chats', require('./routes/chat')); // Changed to /chats (plural)
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/test', require('./routes/test')); // Test routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running with PostgreSQL',
    database: 'PostgreSQL'
  });
});

// Error handling middleware (enhanced security)
app.use((err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Log error internally (not to client)
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Send response based on error type
  if (err.isOperational || isDevelopment) {
    // Safe to send to client (in dev or operational errors)
    res.status(statusCode).json({
      success: false,
      message: err.message,
      ...(isDevelopment && { stack: err.stack }), // Stack trace only in development
      ...(err.errors && { errors: err.errors }) // Validation errors if any
    });
  } else {
    // Internal server error - hide details in production
    res.status(500).json({
      success: false,
      message: isDevelopment 
        ? err.message 
        : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  
  // Start cleanup job (auto-delete old chat rooms after 30 minutes)
  startCleanupJob();
});


