const { User, Notification } = require('../models/db');
const socketManager = require('../socket');

/**
 * สร้างการแจ้งเตือน (Persisted in-memory storage)
 */
exports.createNotification = async (data) => {
  try {
    const { recipient, type, title, message, relatedItem, relatedChat } = data;

    console.log('🔔 Creating notification...');
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Type: ${type}`);
    console.log(`   Title: ${title}`);

    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(recipient);

    if (!user) {
      console.error(`❌ User not found: ${recipient}`);
      return null;
    }
    
    console.log(`✅ User found: ${user.username} (ID: ${user.id})`);

    // Create notification in storage
    const notification = await Notification.create({
      recipient_id: recipient,
      type,
      title,
      message,
      related_item_id: relatedItem || null,
      related_chat_id: relatedChat || null
    });

    console.log(`✅ Notification created (ID: ${notification.id})`);

    // ส่งการแจ้งเตือนแบบเรียลไทม์ผ่าน Socket.IO
    try {
      const io = socketManager.getIO();
      const roomName = `user_${recipient}`;
      console.log(`📡 Sending notification to room: ${roomName}`);
      console.log(`   Title: ${title}`);
      console.log(`   Message: ${message}`);
      
      io.to(roomName).emit('notification', {
        id: notification.id,
        type,
        title,
        message,
        createdAt: notification.created_at
      });
      
      console.log(`✅ Notification sent to ${roomName}`);
    } catch (socketError) {
      console.error('❌ Socket.IO instance not available:', socketError.message);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};


/**
 * สร้างการแจ้งเตือนแบบกลุ่ม (Persisted in-memory storage)
 */
exports.createBatchNotifications = async (notifications) => {
  try {
    const created = [];
    
    for (const notif of notifications) {
      const notification = await Notification.create({
        recipient_id: notif.recipient_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        related_item_id: notif.related_item_id || null,
        related_chat_id: notif.related_chat_id || null
      });
      
      created.push(notification);
      
      // ส่งการแจ้งเตือนแบบเรียลไทม์
      try {
        const io = socketManager.getIO();
        io.to(notif.recipient_id.toString()).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          createdAt: notification.created_at
        });
      } catch (socketError) {
        console.error('Socket.IO error in batch notifications:', socketError.message);
      }
    }

    return created;
  } catch (error) {
    console.error('Error creating batch notifications:', error);
    return [];
  }
};
