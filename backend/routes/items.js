const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter, apiLimiter, itemCreationLimiter } = require('../middleware/rateLimiter');
const { itemValidation, validate, sanitizeInput } = require('../middleware/validator');

// @desc    Get all items with filters
// @route   GET /api/items
// @access  Public
router.get('/', apiLimiter, itemController.getItems);

// @desc    Search items
// @route   GET /api/items/search
// @access  Public
router.get('/search', apiLimiter, itemController.searchItems);

// @desc    Get items statistics
// @route   GET /api/items/stats
// @access  Public
router.get('/stats', itemController.getStats);

// @desc    Get item by ID
// @route   GET /api/items/:id
// @access  Public
router.get('/:id', itemController.getItemById);

// @desc    Create new item
// @route   POST /api/items
// @access  Private
router.post(
  '/',
  protect,
  uploadLimiter,
  itemCreationLimiter,
  upload.array('images', 5),
  itemValidation,
  validate,
  sanitizeInput,
  itemController.createItem
);

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
router.put('/:id', protect, sanitizeInput, itemController.updateItem);

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
router.delete('/:id', protect, itemController.deleteItem);

// @desc    Update item status
// @route   PUT /api/items/:id/status
// @access  Private
router.put('/:id/status', protect, itemController.updateStatus);

// @desc    Get current user's items
// @route   GET /api/items/user/my-items
// @access  Private
router.get('/user/my-items', protect, itemController.getMyItems);

// @desc    Get potential matches for item
// @route   GET /api/items/:id/matches
// @access  Private
router.get('/:id/matches', protect, itemController.getPotentialMatches);

module.exports = router;


