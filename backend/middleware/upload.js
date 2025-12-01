const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/items');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use crypto for completely random filename (prevents guessing)
    const randomName = crypto.randomBytes(32).toString('hex');
    
    // Whitelist allowed extensions only
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }
    
    cb(null, `${randomName}${ext}`);
  }
});

// File filter with strict MIME type checking
const fileFilter = (req, file, cb) => {
  // Whitelist of allowed MIME types (more secure than regex)
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  // Check both extension and MIME type
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp). Invalid file type or extension.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;


