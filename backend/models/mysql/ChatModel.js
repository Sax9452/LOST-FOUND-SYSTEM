/**
 * Chat Model - MySQL Implementation
 */

const pool = require('../../config/database');
const MessageModel = require('./MessageModel');
const { v4: uuidv4 } = require('uuid');

const ChatModel = {
  /**
   * Get or create chat room
   */
  async getOrCreate(user1Id, user2Id) {
    // Normalize user IDs (always store smaller ID first)
    const sortedIds = [user1Id, user2Id].sort();
    const normalizedUser1Id = sortedIds[0];
    const normalizedUser2Id = sortedIds[1];

    // Try to find existing chat room
    let [rows] = await pool.execute(
      'SELECT * FROM chat_rooms WHERE user1_id = ? AND user2_id = ?',
      [normalizedUser1Id, normalizedUser2Id]
    );

    if (rows.length > 0) {
      return await this.findById(rows[0].id);
    }

    // Create new chat room
    const id = uuidv4();
    const now = new Date();

    await pool.execute(
      'INSERT INTO chat_rooms (id, user1_id, user2_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, normalizedUser1Id, normalizedUser2Id, now, now]
    );

    return await this.findById(id);
  },

  /**
   * Find chat room by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT cr.*, 
              u1.id as u1_id, u1.username as u1_username, u1.email as u1_email,
              u2.id as u2_id, u2.username as u2_username, u2.email as u2_email
       FROM chat_rooms cr
       LEFT JOIN users u1 ON cr.user1_id = u1.id
       LEFT JOIN users u2 ON cr.user2_id = u2.id
       WHERE cr.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const chatRoom = rows[0];

    // Get last message
    const [lastMsgRows] = await pool.execute(
      'SELECT * FROM messages WHERE chat_room_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    const lastMessage = lastMsgRows[0] || null;

    return {
      id: chatRoom.id,
      created_at: chatRoom.created_at,
      updated_at: chatRoom.updated_at,
      user1_id: chatRoom.user1_id, // Keep original IDs for compatibility
      user2_id: chatRoom.user2_id,
      participants: [
        {
          id: chatRoom.u1_id || chatRoom.user1_id,
          username: chatRoom.u1_username || 'Unknown',
          email: chatRoom.u1_email || null
        },
        {
          id: chatRoom.u2_id || chatRoom.user2_id,
          username: chatRoom.u2_username || 'Unknown',
          email: chatRoom.u2_email || null
        }
      ],
      lastMessage: lastMessage ? lastMessage.message_text : null,
      lastMessageTime: lastMessage ? lastMessage.created_at : null,
      lastMessageSenderId: lastMessage ? lastMessage.sender_id : null
    };
  },

  /**
   * Find chat rooms by user
   */
  async findByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT cr.*,
              u1.id as u1_id, u1.username as u1_username, u1.email as u1_email,
              u2.id as u2_id, u2.username as u2_username, u2.email as u2_email
       FROM chat_rooms cr
       LEFT JOIN users u1 ON cr.user1_id = u1.id
       LEFT JOIN users u2 ON cr.user2_id = u2.id
       WHERE cr.user1_id = ? OR cr.user2_id = ?
       ORDER BY cr.updated_at DESC`,
      [userId, userId]
    );

    const chatRooms = await Promise.all(rows.map(async (chatRoom) => {
      // Get last message
      const [lastMsgRows] = await pool.execute(
        'SELECT * FROM messages WHERE chat_room_id = ? ORDER BY created_at DESC LIMIT 1',
        [chatRoom.id]
      );
      const lastMessage = lastMsgRows[0] || null;

      // Get unread count
      const unreadCount = await MessageModel.getUnreadCount(chatRoom.id, userId);

      return {
        id: chatRoom.id,
        created_at: chatRoom.created_at,
        updated_at: chatRoom.updated_at,
        participants: [
          {
            id: chatRoom.u1_id,
            username: chatRoom.u1_username || 'Unknown',
            email: chatRoom.u1_email || null
          },
          {
            id: chatRoom.u2_id,
            username: chatRoom.u2_username || 'Unknown',
            email: chatRoom.u2_email || null
          }
        ],
        lastMessage: lastMessage ? lastMessage.message_text : null,
        lastMessageTime: lastMessage ? lastMessage.created_at : null,
        lastMessageSenderId: lastMessage ? lastMessage.sender_id : null,
        unreadCount
      };
    }));

    return chatRooms;
  },

  /**
   * Check if user is participant
   */
  async isParticipant(chatRoomId, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM chat_rooms WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [chatRoomId, userId, userId]
    );
    return rows.length > 0;
  },

};

module.exports = ChatModel;

