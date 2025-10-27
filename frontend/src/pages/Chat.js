import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../api/services';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * Real-time Private Chat Page
 * Combined Inbox + Chat Window with Socket.IO
 */
const Chat = () => {
  const navigate = useNavigate();
  const { socket } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation();

  // State
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ==========================================
  // Helper Functions
  // ==========================================

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  /**
   * Get other participant in chat
   */
  const getOtherParticipant = useCallback((chatRoom) => {
    if (!chatRoom || !chatRoom.participants) return null;
    return chatRoom.participants.find(p => p.id !== user.id);
  }, [user]);

  /**
   * Format timestamp
   */
  const formatMessageTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  /**
   * Format last message time
   */
  const formatLastMessageTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // ==========================================
  // Fetch Functions
  // ==========================================

  /**
   * Fetch all chat rooms
   */
  const fetchChatRooms = useCallback(async () => {
    try {
      const response = await chatService.getChatRooms();
      console.log('📥 Fetched chat rooms:', response.data.chatRooms);
      setChatRooms(response.data.chatRooms || []);
    } catch (error) {
      console.error('❌ Error fetching chat rooms:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch messages for selected chat room
   */
  const fetchMessages = useCallback(async (chatRoomId) => {
    try {
      const response = await chatService.getChatRoom(chatRoomId);
      console.log('📥 Fetched messages:', response.data.chatRoom.messages);
      setMessages(response.data.chatRoom.messages || []);
      setTimeout(() => scrollToBottom(), 100);

      // Mark as read
      await chatService.markAsRead(chatRoomId);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await chatService.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    }
  }, []);

  // ==========================================
  // Event Handlers
  // ==========================================

  /**
   * Select chat room
   */
  const handleSelectChatRoom = async (chatRoom) => {
    setSelectedChatRoom(chatRoom);
    await fetchMessages(chatRoom.id);

    // Join Socket.IO room
    if (socket) {
      socket.emit('join_chat', chatRoom.id);
      console.log(`🔌 Joined chat room: ${chatRoom.id}`);
    }
  };

  /**
   * Send message
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedChatRoom) return;

    const messageText = newMessage.trim();
    setSending(true);
    setNewMessage(''); // Clear input immediately

    try {
      console.log('📤 Sending message:', messageText);
      await chatService.sendMessage(selectedChatRoom.id, messageText);
      console.log('✅ Message sent successfully');

      // ⚠️ DON'T add message to state here!
      // Socket.IO will handle it via 'new_message' event
      // This prevents duplicate messages

      // Stop typing indicator
      if (socket) {
        socket.emit('typing_stop', { chatRoomId: selectedChatRoom.id });
      }

      // Refresh chat list
      fetchChatRooms();
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle typing
   */
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedChatRoom) return;

    // Emit typing_start
    socket.emit('typing_start', { chatRoomId: selectedChatRoom.id });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing_stop
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { chatRoomId: selectedChatRoom.id });
    }, 1000);
  };

  // ==========================================
  // Socket.IO Listeners
  // ==========================================

  useEffect(() => {
    if (!socket) return;

    console.log('🔌 Setting up Socket.IO listeners...');

    // New message
    const handleNewMessage = (data) => {
      console.log('📨 Received new message:', data);
      
      // Update messages if in current chat
      if (selectedChatRoom && data.chatRoomId === selectedChatRoom.id) {
        setMessages(prev => {
          // Prevent duplicates by checking message ID (primary check)
          const exists = prev.some(m => m.id === data.message.id);
          
          if (exists) {
            console.log('⚠️ Duplicate message detected, skipping:', data.message.id);
            return prev;
          }
          
          console.log('✅ Adding new message to chat:', data.message.id);
          return [...prev, data.message];
        });
        setTimeout(() => scrollToBottom(), 100);

        // Mark as read
        chatService.markAsRead(data.chatRoomId);
      }

      // Refresh chat list
      fetchChatRooms();
    };

    // Typing indicator
    const handleUserTyping = (data) => {
      console.log('⌨️ User typing:', data);
      if (selectedChatRoom && data.chatRoomId === selectedChatRoom.id) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }
    };

    // Stop typing
    const handleUserStopTyping = (data) => {
      console.log('⌨️ User stopped typing:', data);
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Unread count update
    const handleUnreadCountUpdate = (data) => {
      console.log('📊 Unread count update:', data);
      setUnreadCount(data.unreadCount || 0);
    };

    // Register listeners
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('unread_count_update', handleUnreadCountUpdate);

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up Socket.IO listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('unread_count_update', handleUnreadCountUpdate);
    };
  }, [socket, selectedChatRoom, fetchChatRooms]);

  // ==========================================
  // Lifecycle
  // ==========================================

  // Initial fetch
  useEffect(() => {
    fetchChatRooms();
    fetchUnreadCount();
  }, [fetchChatRooms, fetchUnreadCount]);

  // Auto-scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Leave chat room on unmount
  useEffect(() => {
    return () => {
      if (socket && selectedChatRoom) {
        socket.emit('leave_chat', selectedChatRoom.id);
      }
    };
  }, [socket, selectedChatRoom]);

  // ==========================================
  // Render
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FiMessageSquare className="text-primary-600" />
              {t('chat.messages')}
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>

          {/* Chat Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
            {/* Left Sidebar - Chat List */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Conversations
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {chatRooms.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <FiMessageSquare className="mx-auto text-5xl mb-3 opacity-30" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start a chat by messaging an item owner</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {chatRooms.map(chatRoom => {
                      const otherUser = getOtherParticipant(chatRoom);
                      if (!otherUser) return null;

                      return (
                        <button
                          key={chatRoom.id}
                          onClick={() => handleSelectChatRoom(chatRoom)}
                          className={`w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedChatRoom?.id === chatRoom.id
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600'
                              : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {otherUser.username?.charAt(0).toUpperCase() || '?'}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                                  {otherUser.username || 'Unknown User'}
                                </h3>
                                {chatRoom.lastMessageTime && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                    {formatLastMessageTime(chatRoom.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {chatRoom.lastMessage || 'No messages yet'}
                              </p>
                            </div>

                            {/* Unread Badge */}
                            {chatRoom.unreadCount > 0 && (
                              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                                {chatRoom.unreadCount}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Chat Window */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
              {selectedChatRoom ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {getOtherParticipant(selectedChatRoom)?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg text-gray-800 dark:text-white">
                        {getOtherParticipant(selectedChatRoom)?.username || 'Unknown User'}
                      </h2>
                      {typingUsers.size > 0 && (
                        <p className="text-sm text-primary-600 italic">typing...</p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => {
                          if (!message || !message.sender) return null;
                          const isOwn = message.sender.id === user.id;

                          return (
                            <div
                              key={message.id || index}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isOwn
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                                }`}
                                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                              >
                                <p className="whitespace-pre-wrap">{message.messageText}</p>
                                <span
                                  className={`text-xs block mt-1 ${
                                    isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {formatMessageTime(message.createdAt)}
                                  {message.isRead && isOwn && ' ✓✓'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2 flex-shrink-0"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      autoComplete="off"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="btn-primary px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiSend />
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <FiMessageSquare className="mx-auto text-6xl mb-4 opacity-30" />
                    <p className="text-lg">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
