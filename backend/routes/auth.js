const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, validate, sanitizeInput } = require('../middleware/validator');

// Public routes
router.post('/register', authLimiter, sanitizeInput, registerValidation, validate, authController.register);
router.post('/login', authLimiter, sanitizeInput, loginValidation, validate, authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, sanitizeInput, authController.updateProfile);
router.put('/update-password', protect, authController.updatePassword);
router.put('/notification-preferences', protect, authController.updateNotificationPreferences);

module.exports = router;


