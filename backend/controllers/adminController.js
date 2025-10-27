const { pool } = require('../config/database');
const { User, Item, Chat, Notification } = require('../models/db');

// @desc    ดู Dashboard สถิติ
// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    // ดึงสถิติต่างๆ
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM items) as total_items,
        (SELECT COUNT(*) FROM items WHERE status = 'pending') as pending_items,
        (SELECT COUNT(*) FROM items WHERE status = 'active') as active_items,
        (SELECT COUNT(*) FROM items WHERE status = 'returned') as returned_items,
        (SELECT COUNT(*) FROM chats WHERE reported = true) as reported_chats,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    // ดึงรายการล่าสุด
    const recentItemsQuery = `
      SELECT i.*, u.username as owner_username 
      FROM items i 
      JOIN users u ON i.owner_id = u.id 
      ORDER BY i.created_at DESC 
      LIMIT 10
    `;
    const recentItems = await pool.query(recentItemsQuery);

    // รายการตามหมวดหมู่
    const categoryQuery = `
      SELECT category, COUNT(*) as count 
      FROM items 
      GROUP BY category 
      ORDER BY count DESC
    `;
    const categoryResult = await pool.query(categoryQuery);

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers: parseInt(stats.total_users),
          totalItems: parseInt(stats.total_items),
          pendingItems: parseInt(stats.pending_items),
          activeItems: parseInt(stats.active_items),
          returnedItems: parseInt(stats.returned_items),
          reportedChats: parseInt(stats.reported_chats),
          newUsers: parseInt(stats.new_users)
        },
        itemsByCategory: categoryResult.rows,
        recentItems: recentItems.rows
      }
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    next(error);
  }
};

// @desc    ดูผู้ใช้ทั้งหมด
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    let query = 'SELECT * FROM users';
    const values = [];

    if (search) {
      query += ' WHERE username ILIKE $1 OR email ILIKE $1';
      values.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, values);

    // นับจำนวนทั้งหมด
    let countQuery = 'SELECT COUNT(*) FROM users';
    const countValues = [];
    if (search) {
      countQuery += ' WHERE username ILIKE $1 OR email ILIKE $1';
      countValues.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countValues);

    res.json({
      success: true,
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
        totalUsers: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('getUsers error:', error);
    next(error);
  }
};

// @desc    อัพเดท role ผู้ใช้
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await User.update(req.params.id, { role });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้นี้'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    next(error);
  }
};

// @desc    ลบผู้ใช้
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [req.params.id]);

    res.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ'
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    next(error);
  }
};

// @desc    ดูรายการรออนุมัติ
// @route   GET /api/admin/items/pending
exports.getPendingItems = async (req, res, next) => {
  try {
    const query = `
      SELECT i.*, u.username as owner_username, u.email as owner_email
      FROM items i
      JOIN users u ON i.owner_id = u.id
      WHERE i.status = 'pending'
      ORDER BY i.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      items: result.rows
    });
  } catch (error) {
    console.error('getPendingItems error:', error);
    next(error);
  }
};

// @desc    อนุมัติรายการ
// @route   PUT /api/admin/items/:id/approve
exports.approveItem = async (req, res, next) => {
  try {
    const item = await Item.update(req.params.id, { status: 'active' });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    // สร้างการแจ้งเตือน
    await Notification.create({
      recipient_id: item.owner_id,
      type: 'admin',
      title: 'รายการได้รับการอนุมัติ',
      message: `รายการ "${item.name}" ของคุณได้รับการอนุมัติแล้ว`,
      related_item_id: item.id
    });

    res.json({
      success: true,
      item,
      message: 'อนุมัติรายการสำเร็จ'
    });
  } catch (error) {
    console.error('approveItem error:', error);
    next(error);
  }
};

// @desc    ปฏิเสธรายการ
// @route   PUT /api/admin/items/:id/reject
exports.rejectItem = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const item = await Item.update(req.params.id, {
      status: 'archived',
      rejection_reason: reason
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    // สร้างการแจ้งเตือน
    await Notification.create({
      recipient_id: item.owner_id,
      type: 'admin',
      title: 'รายการถูกปฏิเสธ',
      message: `รายการ "${item.name}" ถูกปฏิเสธ เหตุผล: ${reason}`,
      related_item_id: item.id
    });

    res.json({
      success: true,
      item,
      message: 'ปฏิเสธรายการสำเร็จ'
    });
  } catch (error) {
    console.error('rejectItem error:', error);
    next(error);
  }
};

// @desc    ลบรายการ (แอดมิน)
// @route   DELETE /api/admin/items/:id
exports.deleteItem = async (req, res, next) => {
  try {
    await Item.delete(req.params.id);

    res.json({
      success: true,
      message: 'ลบรายการสำเร็จ'
    });
  } catch (error) {
    console.error('deleteItem error:', error);
    next(error);
  }
};

// @desc    ดูแชทที่ถูกรายงาน
// @route   GET /api/admin/chats/reported
exports.getReportedChats = async (req, res, next) => {
  try {
    const query = `
      SELECT c.*, i.name as item_name
      FROM chats c
      JOIN items i ON c.item_id = i.id
      WHERE c.reported = true
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      chats: result.rows
    });
  } catch (error) {
    console.error('getReportedChats error:', error);
    next(error);
  }
};

// @desc    จัดการแชทที่ถูกรายงาน
// @route   PUT /api/admin/chats/:id/resolve
exports.resolveReportedChat = async (req, res, next) => {
  try {
    const { action } = req.body; // 'dismiss' หรือ 'deactivate'

    let query = 'UPDATE chats SET reported = false';
    if (action === 'deactivate') {
      query += ', active = false';
    }
    query += ' WHERE id = $1 RETURNING *';

    const result = await pool.query(query, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบแชทนี้'
      });
    }

    res.json({
      success: true,
      chat: result.rows[0],
      message: action === 'deactivate' ? 'ปิดการใช้งานแชทสำเร็จ' : 'ยกเลิกการรายงานสำเร็จ'
    });
  } catch (error) {
    console.error('resolveReportedChat error:', error);
    next(error);
  }
};
