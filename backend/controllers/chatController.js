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
 * @desc    Start a new chat or get existing chat with another user
 * @route   POST /api/chats/start
 * @access  Private
 */
exports.startChat = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }

    if (recipientId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start chat with yourself'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Get or create chat room
    const chatRoom = await ChatRoom.getOrCreate(req.user.id, recipientId);

    res.json({
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
    const chatRoomId = req.params.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(chatRoomId, req.user.id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat room'
      });
    }

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Get messages
    const messages = await Message.findByChatRoom(chatRoomId);

    res.json({
      success: true,
      chatRoom,
      messages
    });
  } catch (error) {
    console.error('getChatRoom error:', error);
    next(error);
  }
};

/**
 * @desc    Send a message in a chat room
 * @route   POST /api/chats/:id/messages
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const chatRoomId = req.params.id;
    const { messageText } = req.body;

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(chatRoomId, req.user.id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send message in this chat room'
      });
    }

    // Create message
    const message = await Message.create(chatRoomId, req.user.id, messageText.trim());

    // Populate sender info
    const sender = await User.findById(req.user.id);
    const messageWithSender = {
      id: message.id,
      chatRoomId: message.chat_room_id,
      messageText: message.message_text,
      createdAt: message.created_at,
      isRead: message.is_read,
      readAt: message.read_at,
      sender: {
        id: sender.id,
        username: sender.username,
        email: sender.email
      }
    };

    // Emit to Socket.IO
    if (io) {
      io.emitNewMessage(chatRoomId, messageWithSender);
      
      // Update unread count for recipient (not sender)
      try {
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (chatRoom && chatRoom.participants && Array.isArray(chatRoom.participants) && chatRoom.participants.length === 2) {
          // Find recipient from participants
          const recipient = chatRoom.participants.find(p => p && p.id && p.id !== req.user.id);
          
          if (recipient && recipient.id && typeof recipient.id === 'string' && recipient.id.trim() !== '') {
            try {
              // Get unread count for recipient (will increase by 1)
              const recipientUnreadCount = await Message.getTotalUnreadCount(recipient.id);
              io.emitUnreadCount(recipient.id, recipientUnreadCount);
            } catch (unreadError) {
              console.error('Error getting recipient unread count:', unreadError);
            }
          } else {
            console.warn('Invalid recipient ID in sendMessage:', recipient);
          }
          
          // Only emit for sender if they have unread messages in other rooms
          // (sender's current room should already be marked as read if they're viewing it)
          if (req.user && req.user.id) {
            try {
              const senderUnreadCount = await Message.getTotalUnreadCount(req.user.id);
              // Only emit if sender has unread messages (to avoid unnecessary emits)
              if (senderUnreadCount > 0) {
                io.emitUnreadCount(req.user.id, senderUnreadCount);
              }
            } catch (unreadError) {
              console.error('Error getting sender unread count:', unreadError);
            }
          }
        }
      } catch (socketError) {
        console.error('Error updating unread count via socket:', socketError);
        // Don't fail the request if socket update fails
      }
    }

    res.status(201).json({
      success: true,
      message: messageWithSender
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    next(error);
  }
};

/**
 * @desc    Mark all messages in chat room as read
 * @route   PUT /api/chats/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const chatRoomId = req.params.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(chatRoomId, req.user.id);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat room'
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const previousUnreadCount = await Message.getTotalUnreadCount(req.user.id);
    await Message.markAsRead(chatRoomId, req.user.id);

    // Emit unread count update only if count changed
    if (io) {
      try {
        const newUnreadCount = await Message.getTotalUnreadCount(req.user.id);
        // Only emit if count actually changed
        if (previousUnreadCount !== newUnreadCount) {
          io.emitUnreadCount(req.user.id, newUnreadCount);
        }
      } catch (socketError) {
        console.error('Error emitting unread count update:', socketError);
        // Don't fail the request if socket update fails
      }
    }

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
 * @desc    Get total unread message count
 * @route   GET /api/chats/unread/count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Message.getTotalUnreadCount(req.user.id);

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    next(error);
  }
};

