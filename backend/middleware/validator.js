const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log errors สำหรับ debugging
    console.error('Validation errors:', errors.array());
    console.error('Request body:', req.body);
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Sanitize input (selective - only for dangerous fields)
exports.sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Fields ที่ต้อง sanitize (user-generated content)
    const fieldsToSanitize = ['description', 'content', 'message', 'reason'];
    
    Object.keys(req.body).forEach(key => {
      if (fieldsToSanitize.includes(key) && typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [], // ไม่อนุญาต HTML tags
          allowedAttributes: {}
        });
      }
    });
  }
  next();
};

// Registration validation rules
exports.registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('กรุณากรอกอีเมลให้ถูกต้อง')
    .normalizeEmail()
    .custom((value) => {
      // ตรวจสอบว่าเป็น @bu.ac.th
      if (!value.endsWith('@bu.ac.th')) {
        throw new Error('กรุณาใช้อีเมล @bu.ac.th เท่านั้น');
      }
      
      // ตรวจสอบรูปแบบ ชื่อ.นามสกุล4ตัว@bu.ac.th
      const emailPattern = /^[a-z]+\.[a-z]{4}@bu\.ac\.th$/i;
      if (!emailPattern.test(value)) {
        throw new Error('รูปแบบอีเมลต้องเป็น ชื่อ.นามสกุล4ตัว@bu.ac.th เช่น zack.lona@bu.ac.th');
      }
      
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
];

// Login validation rules
exports.loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Item validation rules
exports.itemValidation = [
  body('type')
    .isIn(['lost', 'found'])
    .withMessage('Type must be either "lost" or "found"'),
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Item name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('กรุณาเลือกหมวดหมู่')
    .isIn(['electronics', 'documents', 'accessories', 'bags', 'clothing', 'keys', 'wallet', 'other'])
    .withMessage('หมวดหมู่ไม่ถูกต้อง'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
];

// Chat message validation rules
exports.messageValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('ข้อความต้องไม่ว่างเปล่า')
    .isLength({ min: 1, max: 1000 })
    .withMessage('ข้อความต้องมีความยาว 1-1000 ตัวอักษร')
    .customSanitizer((value) => {
      // ลบ whitespace ที่ไม่จำเป็น
      return value.replace(/\s+/g, ' ').trim();
    }),
];

// Chat start validation rules
exports.chatStartValidation = [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid item ID'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
];

// Profile update validation
exports.profileUpdateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('ชื่อผู้ใช้ต้องมีความยาว 3-50 ตัวอักษร'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'),
];

// Password update validation
exports.passwordUpdateValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('กรุณากรอกรหัสผ่านปัจจุบัน'),
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเก่า');
      }
      return true;
    }),
];


