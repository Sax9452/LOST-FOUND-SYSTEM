/**
 * In-Memory Storage for Chats and Messages
 */

const { v4: uuidv4 } = require('uuid');

const chatRooms = new Map(); // key: chatRoomId, value: chatRoom object
const messages = new Map(); // key: messageId, value: message object
const messagesByChat = new Map(); // key: chatRoomId, value: Set of messageIds
const chatsByUser = new Map(); // key: userId, value: Set of chatRoomIds

const ChatStorage = {
  // Chat Rooms
  createChatRoom(user1Id, user2Id) {
    const id = uuidv4();
    const now = new Date();

    const chatRoom = {
      id,
      user1_id: user1Id < user2Id ? user1Id : user2Id,
      user2_id: user1Id < user2Id ? user2Id : user1Id,
      created_at: now,
      updated_at: now
    };

    chatRooms.set(id, chatRoom);
    
    // Index by users
    [chatRoom.user1_id, chatRoom.user2_id].forEach(userId => {
      if (!chatsByUser.has(userId)) {
        chatsByUser.set(userId, new Set());
      }
      chatsByUser.get(userId).add(id);
    });

    return chatRoom;
  },

  findChatRoomById(id) {
    return chatRooms.get(id) || null;
  },

  findChatRoomByUsers(user1Id, user2Id) {
    const user1Chats = chatsByUser.get(user1Id);
    const user2Chats = chatsByUser.get(user2Id);
    
    if (!user1Chats || !user2Chats) return null;

    // Find common chat room
    for (const chatId of user1Chats) {
      if (user2Chats.has(chatId)) {
        const chat = chatRooms.get(chatId);
        if (chat && 
            ((chat.user1_id === user1Id && chat.user2_id === user2Id) ||
             (chat.user1_id === user2Id && chat.user2_id === user1Id))) {
          return chat;
        }
      }
    }
    return null;
  },

  getOrCreateChatRoom(user1Id, user2Id) {
    let chatRoom = this.findChatRoomByUsers(user1Id, user2Id);
    if (!chatRoom) {
      chatRoom = this.createChatRoom(user1Id, user2Id);
    }
    return chatRoom;
  },

  findChatRoomsByUser(userId) {
    const userChatIds = chatsByUser.get(userId);
    if (!userChatIds) return [];

    return Array.from(userChatIds)
      .map(id => chatRooms.get(id))
      .filter(Boolean)
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
  },

  isParticipant(chatRoomId, userId) {
    const chatRoom = chatRooms.get(chatRoomId);
    if (!chatRoom) return false;
    return chatRoom.user1_id === userId || chatRoom.user2_id === userId;
  },

  updateChatRoom(chatRoomId) {
    const chatRoom = chatRooms.get(chatRoomId);
    if (chatRoom) {
      chatRoom.updated_at = new Date();
      chatRooms.set(chatRoomId, chatRoom);
    }
  },

  // Messages
  createMessage(chatRoomId, senderId, messageText) {
    const id = uuidv4();
    const now = new Date();

    const message = {
      id,
      chat_room_id: chatRoomId,
      sender_id: senderId,
      message_text: messageText,
      created_at: now,
      is_read: false,
      read_at: null
    };

    messages.set(id, message);
    
    // Index by chat room
    if (!messagesByChat.has(chatRoomId)) {
      messagesByChat.set(chatRoomId, new Set());
    }
    messagesByChat.get(chatRoomId).add(id);

    // Update chat room
    this.updateChatRoom(chatRoomId);

    return message;
  },

  findMessagesByChatRoom(chatRoomId) {
    const messageIds = messagesByChat.get(chatRoomId);
    if (!messageIds) return [];

    return Array.from(messageIds)
      .map(id => messages.get(id))
      .filter(Boolean)
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  },

  markAsRead(chatRoomId, userId) {
    const messageIds = messagesByChat.get(chatRoomId);
    if (!messageIds) return;

    let count = 0;
    const now = new Date();
    
    messageIds.forEach(msgId => {
      const msg = messages.get(msgId);
      if (msg && msg.sender_id !== userId && !msg.is_read) {
        msg.is_read = true;
        msg.read_at = now;
        messages.set(msgId, msg);
        count++;
      }
    });

    return count;
  },

  getUnreadCount(chatRoomId, userId) {
    const messageIds = messagesByChat.get(chatRoomId);
    if (!messageIds) return 0;

    return Array.from(messageIds).filter(msgId => {
      const msg = messages.get(msgId);
      return msg && msg.sender_id !== userId && !msg.is_read;
    }).length;
  },

  getTotalUnreadCount(userId) {
    let total = 0;
    const userChatIds = chatsByUser.get(userId);
    if (!userChatIds) return 0;

    userChatIds.forEach(chatId => {
      total += this.getUnreadCount(chatId, userId);
    });

    return total;
  },

  clear() {
    chatRooms.clear();
    messages.clear();
    messagesByChat.clear();
    chatsByUser.clear();
  }
};

module.exports = ChatStorage;

