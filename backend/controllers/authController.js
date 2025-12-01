const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/db');

/**
 * Generate JWT Token
 * @param {number} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Register a new user
 * @desc    สมัครสมาชิก
 * @route   POST /api/auth/register
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User email (must be @bu.ac.th)
 * @param {string} req.body.password - User password (min 6 characters)
 * @param {string} [req.body.language='th'] - User preferred language
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} JSON response with token and user data
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, language } = req.body;

    // ตรวจสอบว่ามี user นี้อยู่แล้วหรือไม่
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      });
    }

    // สร้าง username จากอีเมล (เอาส่วนก่อน @)
    const username = email.split('@')[0];

    // เข้ารหัสรหัสผ่าน (configurable salt rounds for security)
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // สร้าง user ใหม่
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      language: language || 'th'
    });

    // สร้าง token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
    });
  }
};

// @desc    เข้าสู่ระบบ
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบ user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // อัพเดท last login
    await User.update(user.id, { last_login: new Date() });

    // สร้าง token
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ดูข้อมูลตัวเอง
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // ลบ password ออก
    delete user.password;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    อัพเดทโปรไฟล์
// @route   PUT /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, phone, location, language } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (language) updateData.language = language;

    const user = await User.update(req.user.id, updateData);
    delete user.password;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    เปลี่ยนรหัสผ่าน
// @route   PUT /api/auth/update-password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    // ตรวจสอบรหัสผ่านเดิม
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'รหัสผ่านเดิมไม่ถูกต้อง'
      });
    }

    // เข้ารหัสรหัสผ่านใหม่ (ใช้ BCRYPT_ROUNDS จาก env เพื่อความสม่ำเสมอ)
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await User.update(req.user.id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    อัพเดทการตั้งค่าการแจ้งเตือน
// @route   PUT /api/auth/notification-preferences
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const { email, push, matchAlerts } = req.body;

    const updateData = {};
    if (email !== undefined) updateData.notification_email = email;
    if (push !== undefined) updateData.notification_push = push;
    if (matchAlerts !== undefined) updateData.notification_match = matchAlerts;

    const user = await User.update(req.user.id, updateData);
    delete user.password;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
