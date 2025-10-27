const { Notification, User } = require('../models/db');
const socketManager = require('../socket');

/**
 * สร้างการแจ้งเตือน
 */
exports.createNotification = async (data) => {
  try {
    const { recipient, type, title, message, relatedItem, relatedChat } = data;

    console.log('🔔 Creating notification...');
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Type: ${type}`);
    console.log(`   Title: ${title}`);

    // สร้างการแจ้งเตือนในฐานข้อมูล
    const notification = await Notification.create({
      recipient_id: recipient,
      type,
      title,
      message,
      related_item_id: relatedItem || null,
      related_chat_id: relatedChat || null
    });

    console.log(`✅ Notification created in DB (ID: ${notification.id})`);

    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(recipient);

    if (!user) {
      console.error(`❌ User not found: ${recipient}`);
      return notification;
    }
    
    console.log(`✅ User found: ${user.username} (ID: ${user.id})`);

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
      console.log(`   Active rooms: ${Array.from(io.sockets.adapter.rooms.keys()).join(', ')}`);
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
 * สร้างการแจ้งเตือนแบบกลุ่ม
 */
exports.createBatchNotifications = async (notifications) => {
  try {
    const created = [];
    
    for (const notif of notifications) {
      const result = await Notification.create(notif);
      created.push(result);
      
      // ส่งการแจ้งเตือนแบบเรียลไทม์
      try {
        const io = socketManager.getIO();
        io.to(notif.recipient_id.toString()).emit('notification', {
          id: result.id,
          type: result.type,
          title: result.title,
          message: result.message,
          createdAt: result.created_at
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
