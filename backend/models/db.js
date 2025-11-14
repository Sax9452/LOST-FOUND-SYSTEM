// Use in-memory storage instead of database
const UserStorage = require('../utils/inMemoryStorage');
const ItemStorage = require('../utils/inMemoryItemStorage');
const ChatStorage = require('../utils/inMemoryChatStorage');
const NotificationStorage = require('../utils/inMemoryNotificationStorage');

// User Model - Uses in-memory storage
const User = {
  async create(userData) {
    return UserStorage.create(userData);
  },

  async findByEmail(email) {
    return UserStorage.findByEmail(email);
  },

  async findById(id) {
    return UserStorage.findById(id);
  },

  async update(id, userData) {
    return UserStorage.update(id, userData);
  }
};

// Item Model
const Item = {
  async create(itemData) {
    return ItemStorage.create(itemData);
  },

  async findAll(filters = {}, limit = 12, offset = 0, orderBy = 'created_at DESC', excludeOwnerId = null) {
    const items = ItemStorage.findAll(filters, limit, offset, orderBy, excludeOwnerId);
    // Populate owner_username from User
    return items.map(item => {
      const owner = UserStorage.findById(item.owner_id);
      return {
        ...item,
        owner_username: owner ? owner.username : 'Unknown'
      };
    });
  },

  async findById(id) {
    const item = ItemStorage.findById(id);
    if (!item) return null;
    
    const owner = UserStorage.findById(item.owner_id);
    return {
      ...item,
      owner_username: owner ? owner.username : 'Unknown',
      owner_email: owner ? owner.email : null,
      owner_phone: owner ? owner.phone : null
    };
  },

  async search(searchTerm, filters = {}, excludeOwnerId = null) {
    const items = ItemStorage.search(searchTerm, filters, excludeOwnerId);
    return items.map(item => {
      const owner = UserStorage.findById(item.owner_id);
      return {
        ...item,
        owner_username: owner ? owner.username : 'Unknown'
      };
    });
  },

  async update(id, updates) {
    return ItemStorage.update(id, updates);
  },

  async delete(id) {
    return ItemStorage.delete(id);
  },

  async findByOwner(ownerId) {
    return ItemStorage.findByOwner(ownerId);
  },

  async incrementViews(id) {
    ItemStorage.incrementViews(id);
  },

  async getStats() {
    return ItemStorage.getStats();
  }
};

// Chat Room Model
const ChatRoom = {
  async getOrCreate(user1Id, user2Id) {
    const chatRoom = ChatStorage.getOrCreateChatRoom(user1Id, user2Id);
    
    // Populate with user data
    const user1 = UserStorage.findById(chatRoom.user1_id);
    const user2 = UserStorage.findById(chatRoom.user2_id);
    
    return {
      id: chatRoom.id,
      user1_id: chatRoom.user1_id,
      user2_id: chatRoom.user2_id,
      created_at: chatRoom.created_at,
      updated_at: chatRoom.updated_at,
      participants: [
        {
          id: chatRoom.user1_id,
          username: user1 ? user1.username : 'Unknown',
          email: user1 ? user1.email : null
        },
        {
          id: chatRoom.user2_id,
          username: user2 ? user2.username : 'Unknown',
          email: user2 ? user2.email : null
        }
      ]
    };
  },

  async findById(id) {
    const chatRoom = ChatStorage.findChatRoomById(id);
    if (!chatRoom) return null;
    
    const user1 = UserStorage.findById(chatRoom.user1_id);
    const user2 = UserStorage.findById(chatRoom.user2_id);
    
    // Get last message
    const allMessages = ChatStorage.findMessagesByChatRoom(id);
    const lastMessage = allMessages[allMessages.length - 1];
    
    // Get unread count (will be calculated per user)
    
    return {
      id: chatRoom.id,
      created_at: chatRoom.created_at,
      updated_at: chatRoom.updated_at,
      participants: [
        {
          id: chatRoom.user1_id,
          username: user1 ? user1.username : 'Unknown',
          email: user1 ? user1.email : null
        },
        {
          id: chatRoom.user2_id,
          username: user2 ? user2.username : 'Unknown',
          email: user2 ? user2.email : null
        }
      ],
      lastMessage: lastMessage ? lastMessage.message_text : null,
      lastMessageTime: lastMessage ? lastMessage.created_at : null,
      lastMessageSenderId: lastMessage ? lastMessage.sender_id : null
    };
  },

  async findByUser(userId) {
    const chatRooms = ChatStorage.findChatRoomsByUser(userId);
    
    return chatRooms.map(chatRoom => {
      const user1 = UserStorage.findById(chatRoom.user1_id);
      const user2 = UserStorage.findById(chatRoom.user2_id);
      
      const allMessages = ChatStorage.findMessagesByChatRoom(chatRoom.id);
      const lastMessage = allMessages[allMessages.length - 1];
      const unreadCount = ChatStorage.getUnreadCount(chatRoom.id, userId);
      
      return {
        id: chatRoom.id,
        created_at: chatRoom.created_at,
        updated_at: chatRoom.updated_at,
        participants: [
          {
            id: chatRoom.user1_id,
            username: user1 ? user1.username : 'Unknown',
            email: user1 ? user1.email : null
          },
          {
            id: chatRoom.user2_id,
            username: user2 ? user2.username : 'Unknown',
            email: user2 ? user2.email : null
          }
        ],
        lastMessage: lastMessage ? lastMessage.message_text : null,
        lastMessageTime: lastMessage ? lastMessage.created_at : null,
        lastMessageSenderId: lastMessage ? lastMessage.sender_id : null,
        unreadCount
      };
    });
  },

  async isParticipant(chatRoomId, userId) {
    return ChatStorage.isParticipant(chatRoomId, userId);
  }
};

// Message Model
const Message = {
  async create(chatRoomId, senderId, messageText) {
    return ChatStorage.createMessage(chatRoomId, senderId, messageText);
  },

  async findByChatRoom(chatRoomId) {
    const messages = ChatStorage.findMessagesByChatRoom(chatRoomId);
    
    return messages.map(msg => {
      const sender = UserStorage.findById(msg.sender_id);
      return {
        id: msg.id,
        chatRoomId: msg.chat_room_id,
        messageText: msg.message_text,
        createdAt: msg.created_at,
        isRead: msg.is_read,
        readAt: msg.read_at,
      sender: {
          id: msg.sender_id,
          username: sender ? sender.username : 'Unknown',
          email: sender ? sender.email : null
      }
      };
    });
  },

  async markAsRead(chatRoomId, userId) {
    ChatStorage.markAsRead(chatRoomId, userId);
  },

  async getUnreadCount(chatRoomId, userId) {
    return ChatStorage.getUnreadCount(chatRoomId, userId);
  },

  async getTotalUnreadCount(userId) {
    return ChatStorage.getTotalUnreadCount(userId);
  }
};

// Notification Model
const Notification = {
  async create(notificationData) {
    return NotificationStorage.create(notificationData);
  },

  async findByUser(userId, limit = 20, offset = 0) {
    return NotificationStorage.findByUser(userId, limit, offset);
  },

  async getUnreadCount(userId) {
    return NotificationStorage.getUnreadCount(userId);
  },

  async markAsRead(id, userId) {
    return NotificationStorage.markAsRead(id, userId);
  },

  async markAllAsRead(userId) {
    NotificationStorage.markAllAsRead(userId);
  },

  async delete(id, userId) {
    return NotificationStorage.delete(id, userId);
  }
};

module.exports = {
  User,
  Item,
  ChatRoom,
  Message,
  Notification
};

