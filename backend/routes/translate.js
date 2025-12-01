const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translateController');
const { protect, optionalAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// ใช้ rate limiter เพื่อป้องกันการเรียกใช้ API มากเกินไป
router.post('/', apiLimiter, translateController.translateText);
router.post('/batch', apiLimiter, translateController.translateBatch);
router.post('/item', apiLimiter, translateController.translateItem);

module.exports = router;

