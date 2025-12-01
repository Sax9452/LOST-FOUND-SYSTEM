import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { notificationService, chatService } from '../api/services';
import toast from 'react-hot-toast';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const [socket, setSocket] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [language, setLanguage] = useState('en');
  const socketRef = useRef(null); // Keep reference to socket to prevent unnecessary reconnections

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadNotifications(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  }, []);

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const response = await chatService.getUnreadCount();
      setUnreadMessages(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  }, []);

  useEffect(() => {
    // Check dark mode preference (default to true if not set)
    const storedDarkMode = localStorage.getItem('darkMode');
    const isDark = storedDarkMode !== null ? storedDarkMode === 'true' : true; // Default dark
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Set default if not exists
    if (storedDarkMode === null) {
      localStorage.setItem('darkMode', 'true');
    }

    // Check language preference
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  useEffect(() => {
    // Only create socket if authenticated and user exists, and socket doesn't exist yet
    if (isAuthenticated && user && !socketRef.current) {
      // Initialize socket connection
      const token = localStorage.getItem('token');
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'] // Allow both transports
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        console.log('   Socket ID:', newSocket.id);
        console.log('   User ID:', user.id);
        console.log('   Will join room: user_' + user.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        // Clear ref if disconnected
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          socketRef.current = null;
          setSocket(null);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      // Notification events
      newSocket.on('notification', (notification) => {
        console.log('🔔 NOTIFICATION RECEIVED:', notification);
        console.log('   Title:', notification.title);
        console.log('   Message:', notification.message);
        
        toast(notification.message, {
          icon: '🔔',
          duration: 5000,
        });
        fetchUnreadCount();
      });

      // Chat events
      newSocket.on('new_message', (data) => {
        console.log('💬 New message received:', data);
        // Don't show toast if already in chat page (handled there)
        if (!window.location.pathname.startsWith('/chat')) {
          toast(t('chat.newMessageReceived'), {
            icon: '💬',
            duration: 4000,
          });
        }
        fetchUnreadMessages();
      });

      newSocket.on('unread_count_update', (data) => {
        console.log('📊 Unread count update:', data);
        setUnreadMessages(data.unreadCount || 0);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Fetch initial counts
      fetchUnreadCount();
      fetchUnreadMessages();

      return () => {
        // Only disconnect if this is still the current socket
        if (socketRef.current === newSocket) {
          console.log('🔌 Disconnecting socket...');
          newSocket.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
      };
    } else if (!isAuthenticated || !user) {
      // Clear socket if not authenticated
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket (not authenticated)...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }
    // Only depend on isAuthenticated and user.id (not the whole user object)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const value = {
    socket,
    unreadNotifications,
    unreadMessages,
    fetchUnreadCount,
    fetchUnreadMessages,
    darkMode,
    toggleDarkMode,
    language,
    changeLanguage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;


