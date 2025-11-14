import axios from './axios';

// Auth Services
export const authService = {
  register: (data) => axios.post('/auth/register', data),
  login: (data) => axios.post('/auth/login', data),
  getMe: () => axios.get('/auth/me'),
  updateProfile: (data) => axios.put('/auth/update-profile', data),
  updatePassword: (data) => axios.put('/auth/update-password', data),
  updateNotificationPreferences: (data) => axios.put('/auth/notification-preferences', data),
};

// Item Services
export const itemService = {
  getItems: (params) => axios.get('/items', { params }),
  searchItems: (params) => axios.get('/items/search', { params }),
  getItemById: (id) => axios.get(`/items/${id}`),
  createItem: (formData) => axios.post('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateItem: (id, data) => axios.put(`/items/${id}`, data),
  deleteItem: (id) => axios.delete(`/items/${id}`),
  updateStatus: (id, data) => axios.put(`/items/${id}/status`, data),
  getMyItems: () => axios.get('/items/user/my-items'),
  getPotentialMatches: (id) => axios.get(`/items/${id}/matches`),
  getStats: () => axios.get('/items/stats'),
};

// Chat Services
export const chatService = {
  getChatRooms: () => axios.get('/chats'),
  getChatRoom: (id) => axios.get(`/chats/${id}`),
  startChat: (recipientId) => axios.post('/chats/start', { recipientId }),
  sendMessage: (chatRoomId, messageText) => axios.post(`/chats/${chatRoomId}/messages`, { messageText }),
  markAsRead: (chatRoomId) => axios.put(`/chats/${chatRoomId}/read`),
  getUnreadCount: () => axios.get('/chats/unread/count'),
};

// Notification Services
export const notificationService = {
  getNotifications: (params) => axios.get('/notifications', { params }),
  getUnreadCount: () => axios.get('/notifications/unread-count'),
  markAsRead: (id) => axios.put(`/notifications/${id}/read`),
  markAllAsRead: () => axios.put('/notifications/read-all'),
  deleteNotification: (id) => axios.delete(`/notifications/${id}`),
};

