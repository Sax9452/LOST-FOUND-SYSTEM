const { Item, User, Notification } = require('../models/db');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const matchingAlgorithm = require('../utils/matchingAlgorithm');
const { createNotification } = require('../utils/notifications');

// @desc    ดูรายการของทั้งหมด (มีตัวกรองและ pagination)
// @route   GET /api/items
exports.getItems = async (req, res, next) => {
  try {
    const {
      type,
      category,
      status = 'active',
      page = 1,
      limit = 12,
      sort = 'created_at DESC'
    } = req.query;

    const filters = { status };
    if (type) filters.type = type;
    if (category) filters.category = category;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const items = await Item.findAll(filters, parseInt(limit), offset, sort);

    // นับจำนวนทั้งหมด
    let countQuery = 'SELECT COUNT(*) FROM items WHERE status = $1';
    const values = [status];
    let paramIndex = 2;

    if (type) {
      countQuery += ` AND type = $${paramIndex}`;
      values.push(type);
      paramIndex++;
    }

    if (category) {
      countQuery += ` AND category = $${paramIndex}`;
      values.push(category);
    }

    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('getItems error:', error);
    next(error);
  }
};

// @desc    ค้นหาของ
// @route   GET /api/items/search
exports.searchItems = async (req, res, next) => {
  try {
    const { q, type, category, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุคำค้นหา'
      });
    }

    const filters = {};
    if (type) filters.type = type;
    if (category) filters.category = category;

    const items = await Item.search(q, filters);

    res.json({
      success: true,
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(items.length / parseInt(limit)),
        totalItems: items.length
      }
    });
  } catch (error) {
    console.error('searchItems error:', error);
    next(error);
  }
};

// @desc    ดูรายละเอียดของ
// @route   GET /api/items/:id
exports.getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    // เพิ่มจำนวนการดู
    await Item.incrementViews(req.params.id);

    // Transform owner data to object
    const transformedItem = {
      ...item,
      owner: {
        id: item.owner_id,
        username: item.owner_username,
        email: item.owner_email,
        phone: item.owner_phone
      }
    };

    // ลบ flat owner fields
    delete transformedItem.owner_id;
    delete transformedItem.owner_username;
    delete transformedItem.owner_email;
    delete transformedItem.owner_phone;

    res.json({
      success: true,
      item: transformedItem
    });
  } catch (error) {
    console.error('getItemById error:', error);
    next(error);
  }
};

/**
 * Create a new lost/found item
 * @desc    ลงประกาศของใหม่
 * @route   POST /api/items
 * @access  Private
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.type - Item type ('lost' or 'found')
 * @param {string} req.body.name - Item name (3-100 characters)
 * @param {string} req.body.description - Item description (10-2000 characters)
 * @param {string} req.body.category - Item category
 * @param {string} req.body.date - Date when item was lost/found (ISO format)
 * @param {string} req.body.location - Location where item was lost/found
 * @param {string} [req.body.coordinates] - GPS coordinates (JSON string)
 * @param {Array} req.files - Uploaded images (max 5, processed with Sharp)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} JSON response with created item
 */
exports.createItem = async (req, res, next) => {
  try {
    const { type, name, description, category, date, location, coordinates } = req.body;

    // ประมวลผลและบีบอัดรูปภาพ (with enhanced security)
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // 1. Validate actual image content (not just extension)
          const metadata = await sharp(file.path).metadata();
          
          // 2. Check image dimensions (prevent extremely large images)
          if (metadata.width > 10000 || metadata.height > 10000) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
              success: false,
              message: 'Image dimensions too large (max 10000x10000)'
            });
          }
          
          // 3. Verify it's actually a valid image format
          const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
          if (!allowedFormats.includes(metadata.format)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
              success: false,
              message: 'Invalid image format'
            });
          }
          
          // 4. Process and compress
          const filename = `compressed-${Date.now()}-${file.filename}`;
          const outputPath = path.join(__dirname, '../uploads/items', filename);

          await sharp(file.path)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(outputPath);

          // 5. Delete original file
          fs.unlinkSync(file.path);

          imagePaths.push(`/uploads/items/${filename}`);
        } catch (imageError) {
          // Clean up on error
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          console.error('Image validation error:', imageError);
          return res.status(400).json({
            success: false,
            message: 'Invalid image file. Please upload a valid image.'
          });
        }
      }
    }

    // สร้างรายการใหม่
    const coords = coordinates ? JSON.parse(coordinates) : {};
    const item = await Item.create({
      type,
      name: name.toLowerCase().trim(), // แปลงเป็นตัวพิมพ์เล็ก
      description: description.toLowerCase().trim(), // แปลงเป็นตัวพิมพ์เล็ก
      category,
      date,
      location,
      latitude: coords.lat || null,
      longitude: coords.lng || null,
      images: imagePaths,
      owner_id: req.user.id
    });

    // หา potential matches และส่ง notification
    try {
      console.log('🔍 Searching for matches...');
      const matches = await matchingAlgorithm.findMatches(item);
      console.log(`📊 Found ${matches ? matches.length : 0} potential matches`);
      
      if (matches && matches.length > 0) {
        console.log(`✅ Sending notifications for ${matches.length} matches...`);
        
        // ส่ง notification ไปยังเจ้าของ matches
        for (const match of matches) {
          console.log(`   → Notifying user ${match.owner.id} (${match.owner.username}) about match with score ${match.matchScore}/18`);
          
          await createNotification({
            recipient: match.owner.id,
            type: 'match',
            title: 'พบของที่อาจตรงกับของของคุณ!',
            message: `มีผู้โพสต์ "${item.name}" ที่อาจตรงกับ "${match.name}" ของคุณ`,
            relatedItem: item.id
          });
        }

        // ส่ง notification ไปยังเจ้าของ item ใหม่
        console.log(`   → Notifying item owner (user ${req.user.id}) about ${matches.length} matches`);
        
        await createNotification({
          recipient: req.user.id,
          type: 'match',
          title: `พบ ${matches.length} รายการที่อาจตรงกัน!`,
          message: `เรามีรายการที่อาจตรงกับ "${item.name}" ของคุณ คลิกเพื่อดูรายละเอียด`,
          relatedItem: item.id
        });
        
        console.log('✅ All match notifications sent successfully!');
      } else {
        console.log('ℹ️ No matches found for this item');
      }
    } catch (matchError) {
      console.error('❌ Error finding matches:', matchError);
      console.error('   Stack:', matchError.stack);
      // ไม่ return error เพราะลงประกาศสำเร็จแล้ว แค่ matching error
    }

    res.status(201).json({
      success: true,
      item,
      message: 'ลงประกาศสำเร็จ!'
    });
  } catch (error) {
    console.error('createItem error:', error);
    next(error);
  }
};

// @desc    แก้ไขข้อมูลของ
// @route   PUT /api/items/:id
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    // ตรวจสอบสิทธิ์
    if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขรายการนี้'
      });
    }

    const { name, description, category, date, location } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (date) updates.date = date;
    if (location) updates.location = location;

    const updatedItem = await Item.update(req.params.id, updates);

    res.json({
      success: true,
      item: updatedItem
    });
  } catch (error) {
    console.error('updateItem error:', error);
    next(error);
  }
};

// @desc    ลบรายการ
// @route   DELETE /api/items/:id
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    // ตรวจสอบสิทธิ์
    if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ลบรายการนี้'
      });
    }

    // ลบรูปภาพ
    if (item.images && item.images.length > 0) {
      for (const imagePath of item.images) {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    await Item.delete(req.params.id);

    res.json({
      success: true,
      message: 'ลบรายการสำเร็จ'
    });
  } catch (error) {
    console.error('deleteItem error:', error);
    next(error);
  }
};

// @desc    อัพเดทสถานะของ
// @route   PUT /api/items/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, matchedWith } = req.body;

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    // ตรวจสอบสิทธิ์
    if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์อัพเดทสถานะ'
      });
    }

    const updates = { status };
    if (matchedWith) updates.matched_with = matchedWith;

    const updatedItem = await Item.update(req.params.id, updates);

    // สร้างการแจ้งเตือน
    await Notification.create({
      recipient_id: item.owner_id,
      type: 'status_update',
      title: 'อัพเดทสถานะของ',
      message: `รายการ "${item.name}" ถูกเปลี่ยนสถานะเป็น ${status}`,
      related_item_id: item.id
    });

    res.json({
      success: true,
      item: updatedItem
    });
  } catch (error) {
    console.error('updateStatus error:', error);
    next(error);
  }
};

// @desc    ดูของของตัวเอง
// @route   GET /api/items/user/my-items
exports.getMyItems = async (req, res, next) => {
  try {
    const items = await Item.findByOwner(req.user.id);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('getMyItems error:', error);
    next(error);
  }
};

// @desc    ดูรายการที่อาจจะตรงกัน
// @route   GET /api/items/:id/matches
exports.getPotentialMatches = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    // หารายการที่ตรงกันข้าม (ถ้าหาย หา found, ถ้าเจอ หา lost)
    const oppositeType = item.type === 'lost' ? 'found' : 'lost';
    const query = `
      SELECT * FROM items 
      WHERE type = $1 
      AND category = $2 
      AND status = 'active'
      AND id != $3
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [oppositeType, item.category, item.id]);

    res.json({
      success: true,
      matches: result.rows
    });
  } catch (error) {
    console.error('getPotentialMatches error:', error);
    next(error);
  }
};

// @desc    ดูสถิติ
// @route   GET /api/items/stats
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Item.getStats();

    const successRate = stats.total_items > 0 
      ? ((parseInt(stats.returned_items) / parseInt(stats.total_items)) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      stats: {
        totalItems: parseInt(stats.total_items),
        returnedItems: parseInt(stats.returned_items),
        activeItems: parseInt(stats.active_items),
        lostItems: parseInt(stats.lost_items),
        foundItems: parseInt(stats.found_items),
        successRate
      }
    });
  } catch (error) {
    console.error('getStats error:', error);
    next(error);
  }
};
