const { ChatRoom, Message, User } = require('../models/db');

// Get Socket.IO instance (will be set after server initialization)
let io;
const setIO = (ioInstance) => { io = ioInstance; };

// Export setIO for initialization
exports.setIO = setIO;

/**
 * @desc    Get all chat rooms for current user
 * @route   GET /api/chats
 * @access  Private
 */
exports.getChatRooms = async (req, res, next) => {
  try {
    const chatRooms = await ChatRoom.findByUser(req.user.id);

    res.json({
      success: true,
      count: chatRooms.length,
      chatRooms
    });
  } catch (error) {
    console.error('getChatRooms error:', error);
    next(error);
  }
};

/**
 * @desc    Get or create chat room with another user
 * @route   POST /api/chats/start
 * @access  Private
 */
exports.startChat = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user.id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    // Cannot chat with yourself
    if (currentUserId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start chat with yourself'
      });
    }

    // Get or create chat room
    const chatRoom = await ChatRoom.getOrCreate(currentUserId, recipientId);

    res.status(201).json({
      success: true,
      chatRoom
    });
  } catch (error) {
    console.error('startChat error:', error);
    next(error);
  }
};

/**
 * @desc    Get chat room by ID with messages
 * @route   GET /api/chats/:id
 * @access  Private
 */
exports.getChatRoom = async (req, res, next) => {
  try {
    const chatRoomId = parseInt(req.params.id);
    const userId = req.user.id;

    // Verify chat room exists
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Verify user is participant
    const isParticipant = await ChatRoom.isParticipant(chatRoomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    // Get messages
    const messages = await Message.findByChatRoom(chatRoomId);

    // Mark messages as read
    await Message.markAsRead(chatRoomId, userId);

    res.json({
      success: true,
      chatRoom: {
        ...chatRoom,
        messages
      }
    });
  } catch (error) {
    console.error('getChatRoom error:', error);
    next(error);
  }
};

/**
 * @desc    Send message in a chat room
 * @route   POST /api/chats/:id/messages
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const chatRoomId = parseInt(req.params.id);
    const { messageText } = req.body;
    const senderId = req.user.id;

    // Verify user is participant
    const isParticipant = await ChatRoom.isParticipant(chatRoomId, senderId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    // Create message
    const message = await Message.create(chatRoomId, senderId, messageText);

    // Get sender info
    const sender = await User.findById(senderId);

    // Format response
    const formattedMessage = {
      id: message.id,
      chatRoomId: message.chat_room_id,
      messageText: message.message_text,
      createdAt: message.created_at,
      isRead: message.is_read,
      sender: {
        id: sender.id,
        username: sender.username,
        email: sender.email
      }
    };

    // Emit real-time message via Socket.IO
    if (io && io.emitNewMessage) {
      io.emitNewMessage(chatRoomId, formattedMessage);
      console.log(`📨 Real-time message emitted for chat room ${chatRoomId}`);
    }

    // Get chat room to find the other participant
    const chatRoom = await ChatRoom.findById(chatRoomId);
    const recipientId = chatRoom.participants.find(p => p.id !== senderId)?.id;
    
    // Update unread count for recipient
    if (io && io.emitUnreadCount && recipientId) {
      const unreadCount = await Message.getTotalUnreadCount(recipientId);
      io.emitUnreadCount(recipientId, unreadCount);
    }
    
    res.status(201).json({
      success: true,
      message: formattedMessage
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    next(error);
  }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chats/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const chatRoomId = parseInt(req.params.id);
    const userId = req.user.id;

    // Verify user is participant
    const isParticipant = await ChatRoom.isParticipant(chatRoomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    await Message.markAsRead(chatRoomId, userId);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    next(error);
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/chats/unread/count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const totalUnread = await Message.getTotalUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: totalUnread
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    next(error);
  }
};

