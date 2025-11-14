/**
 * In-Memory Storage for Notifications
 */

const { v4: uuidv4 } = require('uuid');

const notifications = new Map(); // key: notificationId, value: notification object
const notificationsByUser = new Map(); // key: userId, value: Set of notificationIds

const NotificationStorage = {
  create(notificationData) {
    const id = uuidv4();
    const now = new Date();

    const notification = {
      id,
      recipient_id: notificationData.recipient_id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      related_item_id: notificationData.related_item_id || null,
      related_chat_id: notificationData.related_chat_id || null,
      read: false,
      created_at: now,
      updated_at: now
    };

    notifications.set(id, notification);
    
    // Index by user
    if (!notificationsByUser.has(notificationData.recipient_id)) {
      notificationsByUser.set(notificationData.recipient_id, new Set());
    }
    notificationsByUser.get(notificationData.recipient_id).add(id);

    return notification;
  },

  findByUser(userId, limit = 20, offset = 0) {
    const userNotifications = notificationsByUser.get(userId);
    if (!userNotifications) return [];

    return Array.from(userNotifications)
      .map(id => notifications.get(id))
      .filter(Boolean)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(offset, offset + limit)
      .map(notif => ({
        ...notif,
        item_name: null // Could be populated if needed
      }));
  },

  getUnreadCount(userId) {
    const userNotifications = notificationsByUser.get(userId);
    if (!userNotifications) return 0;

    return Array.from(userNotifications).filter(id => {
      const notif = notifications.get(id);
      return notif && !notif.read;
    }).length;
  },

  markAsRead(id, userId) {
    const notification = notifications.get(id);
    if (notification && notification.recipient_id === userId && !notification.read) {
      notification.read = true;
      notification.updated_at = new Date();
      notifications.set(id, notification);
      return notification;
    }
    return null;
  },

  markAllAsRead(userId) {
    const userNotifications = notificationsByUser.get(userId);
    if (!userNotifications) return 0;

    let count = 0;
    const now = new Date();
    
    userNotifications.forEach(id => {
      const notif = notifications.get(id);
      if (notif && !notif.read) {
        notif.read = true;
        notif.updated_at = now;
        notifications.set(id, notif);
        count++;
      }
    });

    return count;
  },

  delete(id, userId) {
    const notification = notifications.get(id);
    if (notification && notification.recipient_id === userId) {
      notifications.delete(id);
      const userNotifications = notificationsByUser.get(userId);
      if (userNotifications) {
        userNotifications.delete(id);
      }
      return true;
    }
    return false;
  },

  clear() {
    notifications.clear();
    notificationsByUser.clear();
  },

  count() {
    return notifications.size;
  }
};

module.exports = NotificationStorage;

