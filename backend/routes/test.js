const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

/**
 * @route   POST /api/test/notification
 * @desc    ทดสอบส่ง notification (เฉพาะเจ้าของเท่านั้น)
 * @access  Private
 */
router.post('/notification', protect, async (req, res) => {
  try {
    console.log('🧪 TEST: Sending test notification to user:', req.user.id);
    
    // ส่ง notification ให้ตัวเอง
    await createNotification({
      recipient: req.user.id,
      type: 'match',
      title: '🧪 ทดสอบการแจ้งเตือน',
      message: `ทดสอบส่งการแจ้งเตือนให้ ${req.user.username} เวลา ${new Date().toLocaleTimeString('th-TH')}`,
      relatedItem: null
    });
    
    res.json({
      success: true,
      message: 'ส่งการแจ้งเตือนทดสอบแล้ว!'
    });
  } catch (error) {
    console.error('❌ Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน'
    });
  }
});

module.exports = router;

