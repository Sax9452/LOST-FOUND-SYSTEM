import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { notificationService } from '../api/services';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { FiBell, FiCheck, FiTrash2, FiPackage, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslateText } from '../hooks/useTranslate';

const Notifications = () => {
  const { t } = useTranslation();
  const { fetchUnreadCount } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications({ limit: 50 });
      setNotifications(response.data.notifications || []);
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
      toast.error(t('notifications.failedToMarkAsRead'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      fetchUnreadCount();
      toast.success(t('notifications.allNotificationsMarkedAsRead'));
    } catch (error) {
      toast.error(t('notifications.failedToMarkAllAsRead'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      fetchUnreadCount();
    } catch (error) {
      toast.error(t('notifications.failedToDeleteNotification'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  // Component สำหรับแปลชื่อ item ใน notification
  const NotificationItemName = ({ itemName }) => {
    const translated = useTranslateText(itemName);
    return <>{t('notifications.viewItem', { itemName: translated })}</>;
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('notifications.title')}</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-secondary">
            <FiCheck className="w-4 h-4 mr-2" />
            {t('notifications.markAllAsReadButton')}
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`card ${!notification.read ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    {notification.type === 'match' ? (
                      <FiPackage className={`w-5 h-5 mt-1 ${!notification.read ? 'text-primary-600' : 'text-gray-400'}`} />
                    ) : (
                      <FiBell className={`w-5 h-5 mt-1 ${!notification.read ? 'text-primary-600' : 'text-gray-400'}`} />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{notification.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{notification.message}</p>
                      {notification.related_item_id || notification.item_id ? (
                        <Link
                          to={`/items/${notification.related_item_id || notification.item_id}`}
                          className="inline-flex items-center mt-3 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors"
                        >
                          <FiPackage className="w-4 h-4 mr-2" />
                          {notification.item_name ? <NotificationItemName itemName={notification.item_name} /> : t('notifications.viewMatchedItem')}
                          <FiArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      ) : null}
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="btn-secondary text-sm"
                      title={t('notifications.markAsReadTitle')}
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="btn-secondary text-sm text-red-600"
                    title={t('notifications.deleteTitle')}
                  >
                    <FiTrash2 className="w-4 h-4" />
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
            {t('notifications.noNotificationsMessage')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
