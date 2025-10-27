const { pool } = require('../config/database');

// User Model
const User = {
  async create(userData) {
    const { username, email, password, language = 'en' } = userData;
    const query = `
      INSERT INTO users (username, email, password, language)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, language, created_at
    `;
    const result = await pool.query(query, [username, email, password, language]);
    return result.rows[0];
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async update(id, userData) {
    const fields = [];
    const values = [];
    let index = 1;

    Object.keys(userData).forEach(key => {
      fields.push(`${key} = $${index}`);
      values.push(userData[key]);
      index++;
    });

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }
};

// Item Model
const Item = {
  async create(itemData) {
    const { type, name, description, category, date, location, latitude, longitude, images, owner_id } = itemData;
    const query = `
      INSERT INTO items (type, name, description, category, date, location, latitude, longitude, images, owner_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING *
    `;
    const result = await pool.query(query, [type, name, description, category, date, location, latitude, longitude, images, owner_id]);
    return result.rows[0];
  },

  async findAll(filters = {}, limit = 12, offset = 0, orderBy = 'created_at DESC') {
    let query = 'SELECT i.*, u.username as owner_username FROM items i JOIN users u ON i.owner_id = u.id WHERE 1=1';
    const values = [];
    let index = 1;

    if (filters.type) {
      query += ` AND i.type = $${index}`;
      values.push(filters.type);
      index++;
    }

    if (filters.category) {
      query += ` AND i.category = $${index}`;
      values.push(filters.category);
      index++;
    }

    if (filters.status) {
      query += ` AND i.status = $${index}`;
      values.push(filters.status);
      index++;
    }

    // Parse orderBy safely (e.g., "created_at DESC" or "date ASC")
    const validSortColumns = ['created_at', 'date', 'name'];
    const validSortDirections = ['ASC', 'DESC'];
    
    let sortColumn = 'created_at';
    let sortDirection = 'DESC';
    
    if (orderBy) {
      const parts = orderBy.trim().split(/\s+/);
      if (parts.length >= 1 && validSortColumns.includes(parts[0])) {
        sortColumn = parts[0];
      }
      if (parts.length >= 2 && validSortDirections.includes(parts[1].toUpperCase())) {
        sortDirection = parts[1].toUpperCase();
      }
    }

    query += ` ORDER BY i.${sortColumn} ${sortDirection} LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  async findById(id) {
    const query = `
      SELECT i.*, u.username as owner_username, u.email as owner_email, u.phone as owner_phone
      FROM items i 
      JOIN users u ON i.owner_id = u.id 
      WHERE i.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async search(searchTerm, filters = {}) {
    let query = `
      SELECT i.*, u.username as owner_username 
      FROM items i 
      JOIN users u ON i.owner_id = u.id 
      WHERE to_tsvector('english', i.name || ' ' || i.description) @@ plainto_tsquery('english', $1)
    `;
    const values = [searchTerm];
    let index = 2;

    if (filters.type) {
      query += ` AND i.type = $${index}`;
      values.push(filters.type);
      index++;
    }

    if (filters.category) {
      query += ` AND i.category = $${index}`;
      values.push(filters.category);
      index++;
    }

    query += ' ORDER BY i.created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  },

  async update(id, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${index}`);
      values.push(updates[key]);
      index++;
    });

    values.push(id);
    const query = `UPDATE items SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM items WHERE id = $1';
    await pool.query(query, [id]);
  },

  async findByOwner(ownerId) {
    const query = 'SELECT * FROM items WHERE owner_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [ownerId]);
    return result.rows;
  },

  async incrementViews(id) {
    const query = 'UPDATE items SET views = views + 1 WHERE id = $1';
    await pool.query(query, [id]);
  },

  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_items,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items,
        COUNT(CASE WHEN type = 'lost' AND status = 'active' THEN 1 END) as lost_items,
        COUNT(CASE WHEN type = 'found' AND status = 'active' THEN 1 END) as found_items
      FROM items
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
};

// ==========================================
// Chat Room Model (Private 1-to-1 Chat)
// ==========================================
const ChatRoom = {
  /**
   * Get or create a chat room between two users
   * @param {number} user1Id - First user ID
   * @param {number} user2Id - Second user ID
   * @returns {Promise<object>} Chat room object
   */
  async getOrCreate(user1Id, user2Id) {
    const query = 'SELECT get_or_create_chat_room($1, $2) as id';
    const result = await pool.query(query, [user1Id, user2Id]);
    const chatRoomId = result.rows[0].id;
    
    return await this.findById(chatRoomId);
  },

  /**
   * Find chat room by ID
   * @param {number} id - Chat room ID
   * @returns {Promise<object>} Chat room with participants
   */
  async findById(id) {
    const query = `
      SELECT 
        cr.id,
        cr.user1_id,
        cr.user2_id,
        cr.created_at,
        cr.updated_at,
        u1.username as user1_username,
        u1.email as user1_email,
        u2.username as user2_username,
        u2.email as user2_email
      FROM chat_rooms cr
      JOIN users u1 ON cr.user1_id = u1.id
      JOIN users u2 ON cr.user2_id = u2.id
      WHERE cr.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      participants: [
        {
          id: row.user1_id,
          username: row.user1_username,
          email: row.user1_email
        },
        {
          id: row.user2_id,
          username: row.user2_username,
          email: row.user2_email
        }
      ]
    };
  },

  /**
   * Get all chat rooms for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of chat rooms with last message and unread count
   */
  async findByUser(userId) {
    const query = `
      SELECT 
        cr.id,
        cr.user1_id,
        cr.user2_id,
        cr.created_at,
        cr.updated_at,
        u1.username as user1_username,
        u1.email as user1_email,
        u2.username as user2_username,
        u2.email as user2_email,
        last_msg.message_text as last_message,
        last_msg.created_at as last_message_time,
        last_msg.sender_id as last_message_sender_id,
        COALESCE(unread.count, 0) as unread_count
      FROM chat_rooms cr
      JOIN users u1 ON cr.user1_id = u1.id
      JOIN users u2 ON cr.user2_id = u2.id
      LEFT JOIN LATERAL (
        SELECT message_text, created_at, sender_id
        FROM messages
        WHERE chat_room_id = cr.id
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM messages
        WHERE chat_room_id = cr.id 
          AND sender_id != $1 
          AND is_read = FALSE
      ) unread ON true
      WHERE cr.user1_id = $1 OR cr.user2_id = $1
      ORDER BY cr.updated_at DESC
    `;
    const result = await pool.query(query, [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      participants: [
        {
          id: row.user1_id,
          username: row.user1_username,
          email: row.user1_email
        },
        {
          id: row.user2_id,
          username: row.user2_username,
          email: row.user2_email
        }
      ],
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
      lastMessageSenderId: row.last_message_sender_id,
      unreadCount: parseInt(row.unread_count)
    }));
  },

  /**
   * Check if user is participant in chat room
   * @param {number} chatRoomId - Chat room ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user is participant
   */
  async isParticipant(chatRoomId, userId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM chat_rooms 
        WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
      ) as is_participant
    `;
    const result = await pool.query(query, [chatRoomId, userId]);
    return result.rows[0].is_participant;
  }
};

// ==========================================
// Message Model
// ==========================================
const Message = {
  /**
   * Create a new message
   * @param {number} chatRoomId - Chat room ID
   * @param {number} senderId - Sender user ID
   * @param {string} messageText - Message content
   * @returns {Promise<object>} Created message
   */
  async create(chatRoomId, senderId, messageText) {
    const query = `
      INSERT INTO messages (chat_room_id, sender_id, message_text)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        chat_room_id,
        sender_id,
        message_text,
        created_at,
        is_read,
        read_at
    `;
    const result = await pool.query(query, [chatRoomId, senderId, messageText]);
    return result.rows[0];
  },

  /**
   * Get all messages in a chat room
   * @param {number} chatRoomId - Chat room ID
   * @returns {Promise<Array>} Array of messages with sender info
   */
  async findByChatRoom(chatRoomId) {
    const query = `
      SELECT 
        m.id,
        m.chat_room_id,
        m.message_text,
        m.created_at,
        m.is_read,
        m.read_at,
        m.sender_id,
        u.username as sender_username,
        u.email as sender_email
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_room_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await pool.query(query, [chatRoomId]);
    
    return result.rows.map(row => ({
      id: row.id,
      chatRoomId: row.chat_room_id,
      messageText: row.message_text,
      createdAt: row.created_at,
      isRead: row.is_read,
      readAt: row.read_at,
      sender: {
        id: row.sender_id,
        username: row.sender_username,
        email: row.sender_email
      }
    }));
  },

  /**
   * Mark all messages from other user as read
   * @param {number} chatRoomId - Chat room ID
   * @param {number} userId - Current user ID (not the sender)
   * @returns {Promise<void>}
   */
  async markAsRead(chatRoomId, userId) {
    const query = `
      UPDATE messages 
      SET is_read = TRUE, read_at = NOW()
      WHERE chat_room_id = $1 
        AND sender_id != $2 
        AND is_read = FALSE
    `;
    await pool.query(query, [chatRoomId, userId]);
  },

  /**
   * Get unread message count for a user in a chat room
   * @param {number} chatRoomId - Chat room ID
   * @param {number} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(chatRoomId, userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE chat_room_id = $1 
        AND sender_id != $2 
        AND is_read = FALSE
    `;
    const result = await pool.query(query, [chatRoomId, userId]);
    return parseInt(result.rows[0].count);
  },

  /**
   * Get total unread message count for a user across all chats
   * @param {number} userId - User ID
   * @returns {Promise<number>} Total unread count
   */
  async getTotalUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM messages m
      JOIN chat_rooms cr ON m.chat_room_id = cr.id
      WHERE (cr.user1_id = $1 OR cr.user2_id = $1)
        AND m.sender_id != $1
        AND m.is_read = FALSE
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
};

// Notification Model
const Notification = {
  async create(notificationData) {
    const { recipient_id, type, title, message, related_item_id, related_chat_id } = notificationData;
    const query = `
      INSERT INTO notifications (recipient_id, type, title, message, related_item_id, related_chat_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [recipient_id, type, title, message, related_item_id, related_chat_id]);
    return result.rows[0];
  },

  async findByUser(userId, limit = 20, offset = 0) {
    const query = `
      SELECT n.*, i.name as item_name
      FROM notifications n
      LEFT JOIN items i ON n.related_item_id = i.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  },

  async getUnreadCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND read = false';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  },

  async markAsRead(id, userId) {
    const query = 'UPDATE notifications SET read = true WHERE id = $1 AND recipient_id = $2 RETURNING *';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  async markAllAsRead(userId) {
    const query = 'UPDATE notifications SET read = true WHERE recipient_id = $1 AND read = false';
    await pool.query(query, [userId]);
  },

  async delete(id, userId) {
    const query = 'DELETE FROM notifications WHERE id = $1 AND recipient_id = $2';
    await pool.query(query, [id, userId]);
  }
};

module.exports = {
  User,
  Item,
  ChatRoom,
  Message,
  Notification
};

