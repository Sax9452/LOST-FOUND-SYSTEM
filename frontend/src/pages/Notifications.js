import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../api/services';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { t } = useTranslation();
  const { fetchUnreadCount } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications({ limit: 50 });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      );
      fetchUnreadCount();
    } catch (error) {
      toast.error(t('notifications.markReadError'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      fetchUnreadCount();
      toast.success(t('notifications.markAllReadSuccess'));
    } catch (error) {
      toast.error(t('notifications.markAllReadError'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success(t('notifications.deleteSuccess'));
    } catch (error) {
      toast.error(t('notifications.deleteError'));
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      match: '🎯',
      message: '💬',
      status_update: '📦',
      admin: '👮'
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('notifications.title')}</h1>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary flex items-center"
            >
              <FiCheck className="mr-2" />
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`card ${
                  !notification.read ? 'border-l-4 border-primary-600' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                        {(() => {
                          try {
                            const dateStr = notification.created_at || notification.createdAt;
                            if (!dateStr) return 'Recently';
                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) return 'Recently';
                            return format(date, 'MMM dd, HH:mm');
                          } catch (e) {
                            return 'Recently';
                          }
                        })()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4">
                      {notification.related_item_id && (
                        <Link
                          to={`/items/${notification.related_item_id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          {t('notifications.viewItem')} →
                        </Link>
                      )}
                      
                      {notification.related_chat_id && (
                        <Link
                          to="/chat"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          {t('notifications.viewChat')} →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={t('notifications.markAsRead')}
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={t('common.delete')}
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FiBell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('notifications.noNotifications')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('notifications.allCaughtUp')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;


