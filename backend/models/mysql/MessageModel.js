/**
 * Message Model - MySQL Implementation
 */

const pool = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const MessageModel = {
  /**
   * Create a new message
   */
  async create(chatRoomId, senderId, messageText) {
    const id = uuidv4();
    const now = new Date();

    await pool.execute(
      'INSERT INTO messages (id, chat_room_id, sender_id, message_text, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, chatRoomId, senderId, messageText, false, now]
    );

    // Update chat room updated_at
    await pool.execute(
      'UPDATE chat_rooms SET updated_at = NOW() WHERE id = ?',
      [chatRoomId]
    );

    return this.findById(id);
  },

  /**
   * Find message by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT m.*, u.username as sender_username, u.email as sender_email
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find messages by chat room
   */
  async findByChatRoom(chatRoomId) {
    const [rows] = await pool.execute(
      `SELECT m.*, u.username as sender_username, u.email as sender_email
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.chat_room_id = ?
       ORDER BY m.created_at ASC`,
      [chatRoomId]
    );

    return rows.map(msg => ({
      id: msg.id,
      chatRoomId: msg.chat_room_id,
      messageText: msg.message_text,
      createdAt: msg.created_at,
      isRead: msg.is_read === 1 || msg.is_read === true,
      readAt: msg.read_at,
      sender: {
        id: msg.sender_id,
        username: msg.sender_username || 'Unknown',
        email: msg.sender_email || null
      }
    }));
  },

  /**
   * Mark messages as read
   */
  async markAsRead(chatRoomId, userId) {
    const [result] = await pool.execute(
      `UPDATE messages 
       SET is_read = TRUE, read_at = NOW() 
       WHERE chat_room_id = ? AND sender_id != ? AND is_read = FALSE`,
      [chatRoomId, userId]
    );
    return result.affectedRows;
  },

  /**
   * Get unread count for a chat room
   */
  async getUnreadCount(chatRoomId, userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM messages WHERE chat_room_id = ? AND sender_id != ? AND is_read = FALSE',
      [chatRoomId, userId]
    );
    return rows[0].count || 0;
  },

  /**
   * Get total unread count for a user
   */
  async getTotalUnreadCount(userId) {
    if (!userId || userId === undefined || userId === null) {
      console.warn('getTotalUnreadCount called with invalid userId:', userId);
      return 0;
    }
    
    // Ensure userId is a string
    const validUserId = String(userId);
    
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM messages m
       INNER JOIN chat_rooms cr ON m.chat_room_id = cr.id
       WHERE (cr.user1_id = ? OR cr.user2_id = ?) 
         AND m.sender_id != ? 
         AND m.is_read = FALSE`,
      [validUserId, validUserId, validUserId]
    );
    return rows[0]?.count || 0;
  }
};

module.exports = MessageModel;

