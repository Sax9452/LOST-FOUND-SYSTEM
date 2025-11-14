const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validate, messageValidation } = require('../middleware/validator');
const { messageLimiter } = require('../middleware/rateLimiter');

/**
 * Chat Routes (Enhanced with Validation)
 * All routes require authentication
 */

// @route   GET /api/chats
// @desc    Get all chat rooms for current user
// @access  Private
router.get('/', protect, chatController.getChatRooms);

// @route   POST /api/chats/start
// @desc    Start a new chat or get existing chat with another user
// @access  Private
router.post(
  '/start',
  protect,
  [
    body('recipientId')
      .notEmpty()
      .withMessage('Recipient ID is required')
      .custom((value, { req }) => {
        if (value === req.user.id) {
          throw new Error('Cannot start chat with yourself');
        }
        return true;
      })
  ],
  validate,
  chatController.startChat
);

// @route   GET /api/chats/unread/count
// @desc    Get total unread message count
// @access  Private
router.get('/unread/count', protect, chatController.getUnreadCount);

// @route   GET /api/chats/:id
// @desc    Get chat room by ID with messages
// @access  Private
router.get(
  '/:id',
  protect,
  [
    param('id')
      .notEmpty()
      .withMessage('Chat room ID is required')
  ],
  validate,
  chatController.getChatRoom
);

// @route   POST /api/chats/:id/messages
// @desc    Send a message in a chat room
// @access  Private
router.post(
  '/:id/messages',
  protect,
  messageLimiter,
  [
    param('id')
      .notEmpty()
      .withMessage('Chat room ID is required'),
    body('messageText')
      .trim()
      .notEmpty()
      .withMessage('Message cannot be empty')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters')
  ],
  validate,
  chatController.sendMessage
);

// @route   PUT /api/chats/:id/read
// @desc    Mark all messages in chat room as read
// @access  Private
router.put(
  '/:id/read',
  protect,
  [
    param('id')
      .notEmpty()
      .withMessage('Chat room ID is required')
  ],
  validate,
  chatController.markAsRead
);

module.exports = router;

