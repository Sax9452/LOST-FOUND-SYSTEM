import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatService } from '../api/services';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const { socket, fetchUnreadMessages } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const typingDebounceRef = useRef(null);
  const joinedRoomsRef = useRef(new Set()); // Track joined rooms to prevent duplicate joins
  const markAsReadTimeoutRef = useRef(null); // Debounce markAsRead calls
  const isUserScrollingRef = useRef(false); // Track if user is manually scrolling
  const scrollTimeoutRef = useRef(null); // Timeout to reset isUserScrollingRef

  const fetchChatRooms = async () => {
    try {
      const response = await chatService.getChatRooms();
      setChatRooms(response.data.chatRooms || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast.error(t('chat.errorFetchingRooms'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global listener for new messages (updates chat rooms list even when not in that room)
  useEffect(() => {
    if (socket) {
      const handleGlobalNewMessage = (data) => {
        console.log('💬 Global new message received:', data);
        
        const roomId = String(data.chatRoomId || data.chatRoomId);
        const isCurrentlyViewing = selectedChatRoom && String(selectedChatRoom.id) === roomId;
        
        // Only update chat rooms list if not currently viewing this room
        // (room-specific listener handles messages and updates for the current room)
        if (!isCurrentlyViewing) {
          setChatRooms(prev => prev.map(room => {
            const currentRoomId = String(room.id);
            
            if (roomId === currentRoomId) {
              return {
                ...room,
                lastMessage: data.message.messageText,
                lastMessageTime: data.message.createdAt,
                lastMessageSenderId: data.message.sender.id,
                // Increment unread count if message is not from current user
                unreadCount: data.message.sender.id !== user?.id
                  ? (room.unreadCount || 0) + 1
                  : (room.unreadCount || 0)
              };
            }
            return room;
          }));
        }
      };

      const handleGlobalUnreadCountUpdate = (data) => {
        console.log('📊 Global unread count update:', data);
        // Update global unread count via fetchUnreadMessages
        if (fetchUnreadMessages) {
          fetchUnreadMessages();
        }
        
        // Note: Chat rooms list unread counts will be updated via new_message events
        // No need to refresh here to avoid infinite loops
      };

      socket.on('new_message', handleGlobalNewMessage);
      socket.on('unread_count_update', handleGlobalUnreadCountUpdate);

      return () => {
        socket.off('new_message', handleGlobalNewMessage);
        socket.off('unread_count_update', handleGlobalUnreadCountUpdate);
      };
    }
  }, [socket, user, selectedChatRoom, fetchUnreadMessages]);

  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId && chatRooms.length > 0) {
      const room = chatRooms.find(r => r.id === roomId);
      if (room) {
        selectChatRoom(room);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, chatRooms]);

  useEffect(() => {
    if (selectedChatRoom && socket) {
      const roomId = String(selectedChatRoom.id);
      
      // Capture ref value at the start of the effect for cleanup
      const joinedRooms = joinedRoomsRef.current;
      
      // Only join if not already joined
      if (!joinedRooms.has(roomId)) {
        socket.emit('join_chat', selectedChatRoom.id);
        joinedRooms.add(roomId);
        console.log('📨 Joined chat room:', selectedChatRoom.id);
      }
      
      const handleNewMessage = (data) => {
        console.log('💬 New message received:', data);
        // Socket emits { chatRoomId, message }
        const roomId = String(data.chatRoomId || data.chatRoomId);
        const currentRoomId = String(selectedChatRoom.id);
        
        if (roomId === currentRoomId) {
          // Add message to messages list
          setMessages(prev => {
            // Check if message already exists (prevent duplicates)
            const exists = prev.some(msg => msg.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          });
          scrollToBottom(true); // Force scroll when new message arrives
          
          // Update chat rooms list with new lastMessage
          setChatRooms(prev => prev.map(room => {
            if (room.id === selectedChatRoom.id) {
              return {
                ...room,
                lastMessage: data.message.messageText,
                lastMessageTime: data.message.createdAt,
                lastMessageSenderId: data.message.sender.id,
                unreadCount: 0 // Reset unread count when viewing
              };
            }
            return room;
          }));
          
          // Mark as read if it's not from current user (debounced)
          if (data.message.sender.id !== user?.id) {
            // Clear existing timeout
            if (markAsReadTimeoutRef.current) {
              clearTimeout(markAsReadTimeoutRef.current);
            }
            
            // Debounce markAsRead to avoid multiple calls
            markAsReadTimeoutRef.current = setTimeout(() => {
              chatService.markAsRead(selectedChatRoom.id).catch(err => {
                console.error('Error marking as read:', err);
              });
            }, 500);
          }
        }
      };

      const handleUnreadCountUpdate = (data) => {
        console.log('📊 Unread count update:', data);
        // Update global unread count via fetchUnreadMessages
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          if (fetchUnreadMessages) {
            fetchUnreadMessages();
          }
        }, 0);
        
        // Note: Chat rooms list will be updated via global new_message listener
        // No need to refresh here to avoid infinite loops
      };

      const handleTyping = (data) => {
        const roomId = String(data.chatRoomId || data.chatRoomId);
        const currentRoomId = String(selectedChatRoom.id);
        
        if (roomId === currentRoomId && data.userId !== user?.id) {
          // Clear existing timeout for this user
          if (typingTimeoutRef.current[data.userId]) {
            clearTimeout(typingTimeoutRef.current[data.userId]);
          }
          
          // Add typing user
          setTypingUsers(prev => ({ ...prev, [data.userId]: data.username }));
          
          // Clear typing after 3 seconds of inactivity
          typingTimeoutRef.current[data.userId] = setTimeout(() => {
            setTypingUsers(prev => {
              const newState = { ...prev };
              delete newState[data.userId];
              return newState;
            });
            delete typingTimeoutRef.current[data.userId];
          }, 3000);
        }
      };

      const handleStopTyping = (data) => {
        const roomId = String(data.chatRoomId || data.chatRoomId);
        const currentRoomId = String(selectedChatRoom.id);
        
        if (roomId === currentRoomId && data.userId !== user?.id) {
          // Clear timeout
          if (typingTimeoutRef.current[data.userId]) {
            clearTimeout(typingTimeoutRef.current[data.userId]);
            delete typingTimeoutRef.current[data.userId];
          }
          
          // Remove typing user
          setTypingUsers(prev => {
            const newState = { ...prev };
            delete newState[data.userId];
            return newState;
          });
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('unread_count_update', handleUnreadCountUpdate);
      socket.on('user_typing', handleTyping);
      socket.on('user_stop_typing', handleStopTyping);

      return () => {
        const roomId = String(selectedChatRoom.id);
        
        // Only leave if we actually joined
        if (joinedRooms.has(roomId)) {
          socket.emit('leave_chat', selectedChatRoom.id);
          socket.emit('typing_stop', { chatRoomId: selectedChatRoom.id });
          joinedRooms.delete(roomId);
        }
        
        socket.off('new_message', handleNewMessage);
        socket.off('unread_count_update', handleUnreadCountUpdate);
        socket.off('user_typing', handleTyping);
        socket.off('user_stop_typing', handleStopTyping);
        
        // Clear all typing timeouts
        Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
        typingTimeoutRef.current = {};
        if (typingDebounceRef.current) {
          clearTimeout(typingDebounceRef.current);
          typingDebounceRef.current = null;
        }
        if (markAsReadTimeoutRef.current) {
          clearTimeout(markAsReadTimeoutRef.current);
          markAsReadTimeoutRef.current = null;
        }
        setTypingUsers({});
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatRoom?.id, socket, user?.id]); // Only depend on IDs, not objects

  // Auto-scroll when messages change (but only if user is near bottom)
  useEffect(() => {
    if (messages.length > 0 && selectedChatRoom) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom(false); // Don't force, respect user scroll
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, selectedChatRoom?.id]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const selectChatRoom = async (room) => {
    setSelectedChatRoom(room);
    try {
      const response = await chatService.getChatRoom(room.id);
      setMessages(response.data.messages || []);
      
      // Mark as read and update unread count
      try {
        await chatService.markAsRead(room.id);
        
        // Update unread count in chat rooms list
        setChatRooms(prev => prev.map(r => {
          if (r.id === room.id) {
            return { ...r, unreadCount: 0 };
          }
          return r;
        }));
        
        // Refresh unread count
        if (fetchUnreadMessages) {
          fetchUnreadMessages();
        }
      } catch (err) {
        console.error('Error marking as read:', err);
      }
      scrollToBottom(true); // Force scroll when selecting chat room
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(t('chat.failedToLoadMessages'));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatRoom) return;

    setSending(true);
    
    // Stop typing indicator
    if (socket) {
      socket.emit('typing_stop', { chatRoomId: selectedChatRoom.id });
    }
    
    try {
      const response = await chatService.sendMessage(selectedChatRoom.id, newMessage.trim());
      
      // Message will be added via socket event, but add it immediately for better UX
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === response.data.message.id);
        if (exists) return prev;
        return [...prev, response.data.message];
      });
      
      // Update chat rooms list
      setChatRooms(prev => prev.map(room => {
        if (room.id === selectedChatRoom.id) {
          return {
            ...room,
            lastMessage: response.data.message.messageText,
            lastMessageTime: response.data.message.createdAt,
            lastMessageSenderId: response.data.message.sender.id,
            unreadCount: 0 // Reset unread count for current user
          };
        }
        return room;
      }));
      
      setNewMessage('');
      scrollToBottom();
      
      // Refresh unread count
      if (fetchUnreadMessages) {
        fetchUnreadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const message = error.response?.data?.message || t('chat.failedToSendMessage');
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = (force = false) => {
    // Don't auto-scroll if user is manually scrolling (unless forced)
    if (!force && isUserScrollingRef.current) {
      return;
    }
    
    // Use scrollTop instead of scrollIntoView to avoid interfering with user scroll
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      // Fallback to scrollIntoView if ref not available
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // If user scrolls away from bottom, mark as user scrolling
    if (!isNearBottom) {
      isUserScrollingRef.current = true;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset after 2 seconds of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000);
    } else {
      // User is near bottom, allow auto-scroll
      isUserScrollingRef.current = false;
    }
  };

  const getOtherParticipant = (room) => {
    if (!room.participants) return null;
    return room.participants.find(p => p.id !== user?.id);
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

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      <h1 className="text-3xl font-bold mb-8">{t('chat.messages')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat Rooms List */}
        <div className="lg:col-span-1 card overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold mb-4">{t('chat.conversations')}</h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {chatRooms.length > 0 ? (
              chatRooms.map(room => {
                const otherUser = getOtherParticipant(room);
                const isSelected = selectedChatRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => selectChatRoom(room)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-100 dark:bg-primary-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {otherUser?.username || t('chat.unknown')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {room.lastMessage || t('chat.noMessagesYet')}
                        </p>
                      </div>
                      {room.unreadCount > 0 && (
                        <span className="badge badge-error">{room.unreadCount}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiMessageSquare className="w-12 h-12 mx-auto mb-2" />
                <p>{t('chat.noConversationsYet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          {selectedChatRoom ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-xl font-bold">
                  {getOtherParticipant(selectedChatRoom)?.username || t('chat.unknown')}
                </h2>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                onScroll={handleScroll}
                style={{ minHeight: 0 }} // Ensure flex-1 works properly
              >
                {messages.map(msg => {
                  const isOwn = msg.sender.id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <p>{msg.messageText}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                  {Object.values(typingUsers).join(', ')} {t('chat.typing')}...
                </div>
              )}

              {/* Input */}
              <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      
                      // Debounce typing indicator (emit after 500ms of inactivity)
                      if (socket && selectedChatRoom) {
                        // Clear existing debounce
                        if (typingDebounceRef.current) {
                          clearTimeout(typingDebounceRef.current);
                        }
                        
                        if (e.target.value.trim()) {
                          // Emit typing_start after 500ms
                          typingDebounceRef.current = setTimeout(() => {
                            socket.emit('typing_start', { chatRoomId: selectedChatRoom.id });
                          }, 500);
                        } else {
                          // Emit typing_stop immediately when empty
                          socket.emit('typing_stop', { chatRoomId: selectedChatRoom.id });
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    className="input-field flex-1"
                    placeholder={t('chat.typeMessage')}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="btn-primary"
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="w-16 h-16 mx-auto mb-4" />
                <p>{t('chat.selectConversation')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
