const { sequelize } = require('../config/database');
const User = require('./User');
const Item = require('./Item');
const { Chat, Message } = require('./Chat');
const Notification = require('./Notification');

// ความสัมพันธ์ระหว่าง Models

// User <-> Items
User.hasMany(Item, { foreignKey: 'ownerId', as: 'items' });
Item.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Item <-> Item (matched items)
Item.belongsTo(Item, { foreignKey: 'matchedWithId', as: 'matchedItem' });

// Item <-> Chat
Item.hasMany(Chat, { foreignKey: 'itemId', as: 'chats' });
Chat.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// User <-> Messages
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// User <-> Notifications
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// Item <-> Notifications
Item.hasMany(Notification, { foreignKey: 'relatedItemId', as: 'notifications' });
Notification.belongsTo(Item, { foreignKey: 'relatedItemId', as: 'relatedItem' });

// Chat <-> Notifications
Chat.hasMany(Notification, { foreignKey: 'relatedChatId', as: 'notifications' });
Notification.belongsTo(Chat, { foreignKey: 'relatedChatId', as: 'relatedChat' });

// ฟังก์ชันสร้างตารางทั้งหมด
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ สร้างตารางในฐานข้อมูลสำเร็จ');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างตาราง:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Item,
  Chat,
  Message,
  Notification,
  syncDatabase
};

