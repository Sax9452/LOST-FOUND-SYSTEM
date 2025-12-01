/**
 * User Model - MySQL Implementation
 */

const pool = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const UserModel = {
  /**
   * Create a new user
   */
  async create(userData) {
    const id = uuidv4();
    const now = new Date();

    const [result] = await pool.execute(
      `INSERT INTO users (
        id, username, email, password, role, verified, phone, 
        profile_image, language, notification_email, notification_push, 
        notification_match_alerts, location, last_login, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.username,
        userData.email,
        userData.password,
        userData.role || 'user',
        userData.verified || false,
        userData.phone || null,
        userData.profile_image || null,
        userData.language || 'th',
        userData.notification_email !== undefined ? userData.notification_email : true,
        userData.notification_push !== undefined ? userData.notification_push : true,
        userData.notification_match_alerts !== undefined ? userData.notification_match_alerts : true,
        userData.location || null,
        userData.last_login || null,
        now,
        now
      ]
    );

    return this.findById(id);
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Update user
   */
  async update(id, userData) {
    const allowedFields = [
      'username', 'email', 'password', 'role', 'verified', 'phone',
      'profile_image', 'language', 'notification_email', 'notification_push',
      'notification_match_alerts', 'location', 'last_login'
    ];

    const updates = [];
    const values = [];

    Object.keys(userData).forEach(key => {
      if (allowedFields.includes(key) && userData[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return this.findById(id);
  },

  /**
   * Get all users (for admin)
   */
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, verified, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  /**
   * Delete user
   */
  async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get user count
   */
  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  }
};

module.exports = UserModel;

