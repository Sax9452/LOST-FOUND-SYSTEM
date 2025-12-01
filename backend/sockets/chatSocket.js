const jwt = require('jsonwebtoken');
const { User } = require('../models/db');

/**
 * Socket.IO Chat Handler
 * Handles real-time chat events with JWT authentication
 */
module.exports = (io) => {
  // ==========================================
  // Socket.IO Middleware - JWT Authentication
  // ==========================================
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        console.log('❌ Socket connection rejected: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from storage
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('❌ Socket connection rejected: User not found');
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.username = user.username;
      socket.email = user.email;
      
      console.log(`✅ Socket authenticated: ${user.username} (ID: ${user.id})`);
      next();
    } catch (error) {
      console.log('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ==========================================
  // Socket.IO Connection Handler
  // ==========================================
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.username} (Socket ID: ${socket.id})`);

    // Join user's personal room for notifications
    socket.join(`user_${socket.userId}`);
    console.log(`   📌 Joined personal room: user_${socket.userId}`);

    // ==========================================
    // Event: Join Chat Room (with Authorization)
    // ==========================================
    socket.on('join_chat', async (chatRoomId) => {
      try {
        // Validate input (chatRoomId is UUID string)
        if (!chatRoomId || typeof chatRoomId !== 'string') {
          console.log(`❌ ${socket.username} sent invalid chat room ID: ${chatRoomId}`);
          socket.emit('error', { message: 'Invalid chat room ID' });
          return;
        }
        
        // Check if user is participant
        const { ChatRoom } = require('../models/db');
        const isParticipant = await ChatRoom.isParticipant(chatRoomId, socket.userId);
        
        if (!isParticipant) {
          console.log(`❌ ${socket.username} (ID: ${socket.userId}) tried to join unauthorized chat room ${chatRoomId}`);
          socket.emit('error', { message: 'Not authorized to join this chat room' });
          return;
        }
        
        // Join room (authorized)
        const roomName = `chat_${chatRoomId}`;
        socket.join(roomName);
        console.log(`   ✅ ${socket.username} joined authorized chat room: ${roomName}`);
        
        // Notify other user in the room
        socket.to(roomName).emit('user_joined', {
          userId: socket.userId,
          username: socket.username
        });
      } catch (error) {
        console.error('join_chat error:', error);
        socket.emit('error', { message: 'Failed to join chat room' });
      }
    });

    // ==========================================
    // Event: Leave Chat Room
    // ==========================================
    socket.on('leave_chat', (chatRoomId) => {
      const roomName = `chat_${chatRoomId}`;
      socket.leave(roomName);
      console.log(`   📌 ${socket.username} left chat room: ${roomName}`);
      
      // Notify other user in the room
      socket.to(roomName).emit('user_left', {
        userId: socket.userId,
        username: socket.username
      });
    });

    // ==========================================
    // Event: Typing Indicator (Start)
    // ==========================================
    socket.on('typing_start', ({ chatRoomId }) => {
      const roomName = `chat_${chatRoomId}`;
      console.log(`   ⌨️  ${socket.username} started typing in ${roomName}`);
      
      // Notify others in the room (not sender)
      socket.to(roomName).emit('user_typing', {
        chatRoomId,
        userId: socket.userId,
        username: socket.username
      });
    });

    // ==========================================
    // Event: Typing Indicator (Stop)
    // ==========================================
    socket.on('typing_stop', ({ chatRoomId }) => {
      const roomName = `chat_${chatRoomId}`;
      console.log(`   ⌨️  ${socket.username} stopped typing in ${roomName}`);
      
      // Notify others in the room (not sender)
      socket.to(roomName).emit('user_stop_typing', {
        chatRoomId,
        userId: socket.userId
      });
    });

    // ==========================================
    // Event: Message Read Receipt
    // ==========================================
    socket.on('message_read', ({ chatRoomId, messageId }) => {
      const roomName = `chat_${chatRoomId}`;
      console.log(`   ✓✓ ${socket.username} read message ${messageId} in ${roomName}`);
      
      // Notify others in the room
      socket.to(roomName).emit('message_read_receipt', {
        chatRoomId,
        messageId,
        userId: socket.userId,
        readAt: new Date()
      });
    });

    // ==========================================
    // Event: Disconnect
    // ==========================================
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.username} (Reason: ${reason})`);
    });

    // ==========================================
    // Event: Error
    // ==========================================
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.username}:`, error);
    });
  });

  // ==========================================
  // Helper Functions (can be called from controllers)
  // ==========================================
  
  /**
   * Emit new message to a chat room
   * @param {number} chatRoomId - Chat room ID
   * @param {object} message - Message object
   */
  io.emitNewMessage = (chatRoomId, message) => {
    if (!chatRoomId || !message) {
      console.warn('emitNewMessage called with invalid parameters:', { chatRoomId, message });
      return;
    }
    
    const roomName = `chat_${chatRoomId}`;
    console.log(`📨 Emitting new message to room: ${roomName}`);
    console.log(`   Message:`, message);
    
    // Ensure chatRoomId is string (UUID)
    const roomIdString = String(chatRoomId);
    
    io.to(roomName).emit('new_message', {
      chatRoomId: roomIdString,
      message
    });
  };

  /**
   * Emit notification to a specific user
   * @param {number} userId - User ID
   * @param {object} notification - Notification object
   */
  io.emitNotification = (userId, notification) => {
    if (!userId) {
      console.warn('emitNotification called with undefined userId');
      return;
    }
    
    const roomName = `user_${userId}`;
    console.log(`🔔 Emitting notification to user: ${userId}`);
    
    io.to(roomName).emit('notification', notification);
  };

  /**
   * Emit unread count update to a user
   * @param {number} userId - User ID
   * @param {number} unreadCount - Unread message count
   */
  io.emitUnreadCount = (userId, unreadCount) => {
    if (!userId) {
      console.warn('emitUnreadCount called with undefined userId');
      return;
    }
    
    const roomName = `user_${userId}`;
    console.log(`📊 Emitting unread count to user ${userId}: ${unreadCount}`);
    
    io.to(roomName).emit('unread_count_update', {
      unreadCount: unreadCount || 0
    });
  };

  console.log('✅ Socket.IO chat handlers initialized');
};

