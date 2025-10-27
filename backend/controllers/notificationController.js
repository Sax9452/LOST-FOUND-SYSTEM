const { Notification } = require('../models/db');
const { pool } = require('../config/database');

// @desc    ดูการแจ้งเตือนทั้งหมด
// @route   GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.findByUser(
      req.user.id,
      parseInt(limit),
      offset
    );

    // นับจำนวนทั้งหมด
    const countQuery = 'SELECT COUNT(*) FROM notifications WHERE recipient_id = $1';
    const countResult = await pool.query(countQuery, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalNotifications: total
      }
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    next(error);
  }
};

// @desc    ดูจำนวนที่ยังไม่ได้อ่าน
// @route   GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    next(error);
  }
};

// @desc    ทำเครื่องหมายว่าอ่านแล้ว
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.markAsRead(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการแจ้งเตือนนี้'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    next(error);
  }
};

// @desc    ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว'
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    next(error);
  }
};

// @desc    ลบการแจ้งเตือน
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.delete(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'ลบการแจ้งเตือนสำเร็จ'
    });
  } catch (error) {
    console.error('deleteNotification error:', error);
    next(error);
  }
};
