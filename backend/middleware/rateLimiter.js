const rateLimit = require('express-rate-limit');

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Development: 50, Production: 5
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

// Upload rate limiter
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Too many uploads, please try again later.'
  },
});

// Message rate limiter (prevent spam)
exports.messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each user to 20 messages per minute
  message: {
    success: false,
    message: 'คุณส่งข้อความเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Item creation rate limiter
exports.itemCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 items per hour
  message: {
    success: false,
    message: 'คุณลงประกาศมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่อีกครั้ง'
  },
  standardHeaders: true,
  legacyHeaders: false,
});


