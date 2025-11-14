const jwt = require('jsonwebtoken');
const { User } = require('../models/db');

// ป้องกัน routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'ไม่พบผู้ใช้งาน'
        });
      }

      // ลบ password ออก
      delete req.user.password;
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุ'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Optional auth - จะ set req.user ถ้ามี token แต่ไม่ error ถ้าไม่มี
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        
        if (req.user) {
          // ลบ password ออก
          delete req.user.password;
        }
      } catch (error) {
        // ถ้า token ไม่ถูกต้อง ไม่ต้อง error แค่ไม่ set req.user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware สำหรับ admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'ไม่มีสิทธิ์เข้าถึง (Admin เท่านั้น)'
    });
  }
};
