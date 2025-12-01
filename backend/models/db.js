// MySQL Database Models
const UserModel = require('./mysql/UserModel');
const ItemModel = require('./mysql/ItemModel');
const ChatModel = require('./mysql/ChatModel');
const MessageModel = require('./mysql/MessageModel');
const NotificationModel = require('./mysql/NotificationModel');

// User Model - MySQL Implementation
const User = {
  async create(userData) {
    return UserModel.create(userData);
  },

  async findByEmail(email) {
    return UserModel.findByEmail(email);
  },

  async findById(id) {
    return UserModel.findById(id);
  },

  async update(id, userData) {
    return UserModel.update(id, userData);
  }
};

// Item Model - MySQL Implementation
const Item = {
  async create(itemData) {
    return ItemModel.create(itemData);
  },

  async findAll(filters = {}, limit = 12, offset = 0, orderBy = 'created_at DESC', excludeOwnerId = null) {
    return ItemModel.findAll(filters, limit, offset, orderBy, excludeOwnerId);
  },

  async findById(id) {
    return ItemModel.findById(id);
  },

  async search(searchTerm, filters = {}, excludeOwnerId = null, limit = null, offset = null) {
    return ItemModel.search(searchTerm, filters, excludeOwnerId, limit, offset);
  },

  async update(id, updates) {
    return ItemModel.update(id, updates);
  },

  async delete(id) {
    return ItemModel.delete(id);
  },

  async findByOwner(ownerId) {
    return ItemModel.findByOwner(ownerId);
  },

  async incrementViews(id) {
    return ItemModel.incrementViews(id);
  },

  async getStats() {
    return ItemModel.getStats();
  },

  async count(filters = {}, excludeOwnerId = null) {
    return ItemModel.count(filters, excludeOwnerId);
  }
};

// Chat Room Model - MySQL Implementation
const ChatRoom = {
  async getOrCreate(user1Id, user2Id) {
    return ChatModel.getOrCreate(user1Id, user2Id);
  },

  async findById(id) {
    return ChatModel.findById(id);
  },

  async findByUser(userId) {
    return ChatModel.findByUser(userId);
  },

  async isParticipant(chatRoomId, userId) {
    return ChatModel.isParticipant(chatRoomId, userId);
  }
};

// Message Model - MySQL Implementation
const Message = {
  async create(chatRoomId, senderId, messageText) {
    return MessageModel.create(chatRoomId, senderId, messageText);
  },

  async findByChatRoom(chatRoomId) {
    return MessageModel.findByChatRoom(chatRoomId);
  },

  async markAsRead(chatRoomId, userId) {
    return MessageModel.markAsRead(chatRoomId, userId);
  },

  async getUnreadCount(chatRoomId, userId) {
    return MessageModel.getUnreadCount(chatRoomId, userId);
  },

  async getTotalUnreadCount(userId) {
    return MessageModel.getTotalUnreadCount(userId);
  }
};

// Notification Model - MySQL Implementation
const Notification = {
  async create(notificationData) {
    return NotificationModel.create(notificationData);
  },

  async findByUser(userId, limit = 20, offset = 0) {
    return NotificationModel.findByUser(userId, limit, offset);
  },

  async getUnreadCount(userId) {
    return NotificationModel.getUnreadCount(userId);
  },

  async markAsRead(id, userId) {
    return NotificationModel.markAsRead(id, userId);
  },

  async markAllAsRead(userId) {
    return NotificationModel.markAllAsRead(userId);
  },

  async delete(id, userId) {
    return NotificationModel.delete(id, userId);
  }
};

module.exports = {
  User,
  Item,
  ChatRoom,
  Message,
  Notification
};

