/**
 * Notification Model - MySQL Implementation
 */

const pool = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const NotificationModel = {
  /**
   * Create a new notification
   */
  async create(notificationData) {
    const id = uuidv4();
    const now = new Date();

    await pool.execute(
      `INSERT INTO notifications (
        id, recipient_id, type, title, message, 
        related_item_id, related_chat_id, \`read\`, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        notificationData.recipient_id,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.related_item_id || null,
        notificationData.related_chat_id || null,
        false,
        now,
        now
      ]
    );

    return this.findById(id);
  },

  /**
   * Find notification by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find notifications by user
   */
  async findByUser(userId, limit = 20, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT n.*, i.name as item_name, i.id as item_id
       FROM notifications n
       LEFT JOIN items i ON n.related_item_id = i.id
       WHERE n.recipient_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows.map(notif => ({
      ...notif,
      read: notif.read === 1 || notif.read === true,
      related_item_id: notif.related_item_id || null,
      item_id: notif.item_id || notif.related_item_id || null
    }));
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND `read` = FALSE',
      [userId]
    );
    return rows[0].count || 0;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id, userId) {
    const [result] = await pool.execute(
      'UPDATE notifications SET `read` = TRUE, updated_at = NOW() WHERE id = ? AND recipient_id = ? AND `read` = FALSE',
      [id, userId]
    );
    
    if (result.affectedRows > 0) {
      return this.findById(id);
    }
    return null;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    const [result] = await pool.execute(
      'UPDATE notifications SET `read` = TRUE, updated_at = NOW() WHERE recipient_id = ? AND `read` = FALSE',
      [userId]
    );
    return result.affectedRows;
  },

  /**
   * Delete notification
   */
  async delete(id, userId) {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND recipient_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = NotificationModel;

