/**
 * In-Memory Storage for Users
 * เก็บข้อมูล users ใน memory แทน database
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage
const users = new Map(); // key: userId (UUID), value: user object
const usersByEmail = new Map(); // key: email, value: userId (for quick lookup)

// Helper function to convert user to plain object (remove password)
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const UserStorage = {
  /**
   * Create a new user
   */
  create(userData) {
    const id = uuidv4();
    const now = new Date();
    
    const user = {
      id,
      username: userData.username,
      email: userData.email,
      password: userData.password, // already hashed
      role: userData.role || 'user',
      verified: userData.verified || false,
      phone: userData.phone || null,
      profile_image: userData.profile_image || null,
      language: userData.language || 'th',
      notification_email: userData.notification_email !== undefined ? userData.notification_email : true,
      notification_push: userData.notification_push !== undefined ? userData.notification_push : true,
      notification_match_alerts: userData.notification_match_alerts !== undefined ? userData.notification_match_alerts : true,
      location: userData.location || null,
      last_login: userData.last_login || null,
      created_at: now,
      updated_at: now
    };

    users.set(id, user);
    usersByEmail.set(userData.email.toLowerCase(), id);

    return sanitizeUser(user);
  },

  /**
   * Find user by email
   */
  findByEmail(email) {
    const userId = usersByEmail.get(email.toLowerCase());
    if (!userId) return null;
    
    const user = users.get(userId);
    return user || null; // return with password for verification
  },

  /**
   * Find user by ID
   */
  findById(id) {
    const user = users.get(id);
    return user || null; // return with password for verification
  },

  /**
   * Update user
   */
  update(id, userData) {
    const user = users.get(id);
    if (!user) return null;

    // Update fields
    Object.keys(userData).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        user[key] = userData[key];
      }
    });

    user.updated_at = new Date();

    // Update email index if email changed
    if (userData.email && userData.email !== user.email) {
      usersByEmail.delete(user.email.toLowerCase());
      usersByEmail.set(userData.email.toLowerCase(), id);
    }

    users.set(id, user);
    return user; // return with password (middleware will remove it)
  },

  /**
   * Get all users (for admin purposes)
   */
  findAll() {
    return Array.from(users.values()).map(user => sanitizeUser(user));
  },

  /**
   * Delete user
   */
  delete(id) {
    const user = users.get(id);
    if (user) {
      usersByEmail.delete(user.email.toLowerCase());
      users.delete(id);
      return true;
    }
    return false;
  },

  /**
   * Get user count
   */
  count() {
    return users.size;
  },

  /**
   * Clear all users (for testing)
   */
  clear() {
    users.clear();
    usersByEmail.clear();
  }
};

module.exports = UserStorage;

