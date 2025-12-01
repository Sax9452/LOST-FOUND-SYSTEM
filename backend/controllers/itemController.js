const { Item, User } = require('../models/db');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../utils/notifications');

// @desc    ดูรายการของทั้งหมด (มีตัวกรองและ pagination)
// @route   GET /api/items
exports.getItems = async (req, res, next) => {
  try {
    const {
      type,
      category,
      location,
      dateFrom,
      dateTo,
      status = 'active',
      page = 1,
      limit = 12,
      sort = 'created_at DESC',
      includeOwn = 'false' // Allow including own items
    } = req.query;

    const filters = { status };
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (location) filters.location = location;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    // Exclude current user's items if logged in (unless includeOwn=true)
    const excludeOwnerId = (req.user && includeOwn !== 'true') ? req.user.id : null;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const items = await Item.findAll(filters, parseInt(limit), offset, sort, excludeOwnerId);

    // Calculate total using COUNT query (more efficient than fetching all items)
    // Use all filters to get accurate count
    const totalItems = await Item.count(filters, excludeOwnerId);

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
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Send more detailed error in development
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        error: error.message,
        sqlError: error.sqlMessage || null,
        code: error.code || null
      });
    }
    
    next(error);
  }
};

// @desc    ค้นหาของ
// @route   GET /api/items/search
exports.searchItems = async (req, res, next) => {
  try {
    const { q, type, category, status = 'active', page = 1, limit = 12, includeOwn = 'false' } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกคำค้นหา'
      });
    }

    const filters = { status };
    if (type) filters.type = type;
    if (category) filters.category = category;

    // Exclude current user's items if logged in (unless includeOwn=true)
    const excludeOwnerId = (req.user && includeOwn !== 'true') ? req.user.id : null;

    // Use SQL pagination instead of in-memory slicing for better performance
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const results = await Item.search(q.trim(), filters, excludeOwnerId, parseInt(limit), offset);
    const totalResults = await Item.count({ ...filters, searchTerm: q.trim() }, excludeOwnerId);

    res.json({
      success: true,
      items: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResults / parseInt(limit)),
        totalItems: totalResults,
        itemsPerPage: parseInt(limit)
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

    // Increment views
    await Item.incrementViews(req.params.id);

    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('getItemById error:', error);
    next(error);
  }
};

// @desc    สร้างของใหม่
// @route   POST /api/items
exports.createItem = async (req, res, next) => {
  try {
    const { type, name, description, category, date, location, latitude, longitude } = req.body;

    // Process images
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Generate unique filename
          const filename = `item-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const outputPath = path.join(__dirname, '../uploads/items', filename);

          // Resize and optimize image
          await sharp(file.path)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(outputPath);

          // Delete original
          fs.unlinkSync(file.path);

          images.push(`/uploads/items/${filename}`);
        } catch (error) {
          console.error('Image processing error:', error);
        }
      }
    }

    // Create item
    const item = await Item.create({
      type,
      name,
      description,
      category,
      date,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      images,
      owner_id: req.user.id,
      status: 'active'
    });

    // Find potential matches and send notifications
    let matchesCount = 0;
    try {
      const oppositeType = type === 'lost' ? 'found' : 'lost';
      const allItems = await Item.findAll(
        { category, type: oppositeType, status: 'active' },
        100,
        0,
        'created_at DESC',
        req.user.id // Exclude current user's items
      );

      // Filter by date range (within 30 days)
      const itemDate = new Date(date);
      const dateStart = new Date(itemDate);
      dateStart.setDate(dateStart.getDate() - 30);
      const dateEnd = new Date(itemDate);
      dateEnd.setDate(dateEnd.getDate() + 30);

      const matches = allItems.filter(matchItem => {
        const matchDate = new Date(matchItem.date);
        return matchDate >= dateStart && matchDate <= dateEnd;
      });

      matchesCount = matches.length;

      // Send notifications to owners of matching items
      for (const matchItem of matches.slice(0, 10)) {
        const matchOwner = await User.findById(matchItem.owner_id);
        if (matchOwner) {
          await createNotification({
            recipient: matchItem.owner_id,
            type: 'match',
            title: 'พบสิ่งของที่อาจตรงกัน!',
            message: `พบ${type === 'lost' ? 'ของหาย' : 'ของพบ'} "${name}" ที่อาจตรงกับ${type === 'lost' ? 'ของที่คุณพบ' : 'ของที่คุณหาย'} "${matchItem.name}"`,
            relatedItem: item.id
          });
        }
      }

      console.log(`✅ Sent ${matches.length} matching notifications for item ${item.id}`);
    } catch (matchError) {
      console.error('Error finding matches and sending notifications:', matchError);
      // Don't fail the request if matching fails
    }

    res.status(201).json({
      success: true,
      item,
      matchesFound: matchesCount || 0
    });
  } catch (error) {
    console.error('createItem error:', error);
    next(error);
  }
};

// @desc    อัพเดทของ
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

    if (item.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขรายการนี้'
      });
    }

    // Process new images if uploaded
    let newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Generate unique filename
          const filename = `item-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const outputPath = path.join(__dirname, '../uploads/items', filename);

          // Resize and optimize image
          await sharp(file.path)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(outputPath);

          // Delete original
          fs.unlinkSync(file.path);

          newImages.push(`/uploads/items/${filename}`);
        } catch (error) {
          console.error('Image processing error:', error);
        }
      }
    }

    // Get existing images from request (images that should be kept)
    const existingImagesToKeep = req.body.existingImages 
      ? (Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages])
      : [];
    
    // Combine existing images (that should be kept) with new images
    const allImages = [...existingImagesToKeep, ...newImages];

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description) updates.description = req.body.description;
    if (req.body.category) updates.category = req.body.category;
    if (req.body.date) updates.date = req.body.date;
    if (req.body.location) updates.location = req.body.location;
    if (req.body.latitude !== undefined) updates.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) updates.longitude = req.body.longitude;
    
    // Update images if there are changes (new images added or existing images removed)
    if (newImages.length > 0 || existingImagesToKeep.length !== (item.images?.length || 0)) {
      updates.images = allImages;
    }

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

// @desc    ลบของ
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

    if (item.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ลบรายการนี้'
      });
    }

    // Delete images
    if (item.images && item.images.length > 0) {
      item.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '../', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
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
    const { status, matchedWithId } = req.body;
    const validStatuses = ['pending', 'active', 'matched', 'returned', 'archived'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง'
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการนี้'
      });
    }

    if (item.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขสถานะ'
      });
    }

    // Validate status transitions based on item type
    const currentStatus = item.status;
    
    // Get allowed transitions based on item type (lost/found)
    const getAllowedTransitions = (itemType, currentStatus) => {
      // Allow unarchiving: archived -> active (to reopen the listing)
      if (currentStatus === 'archived') return ['active'];
      
      if (currentStatus === 'pending') return ['active', 'archived'];
      if (currentStatus === 'returned') return ['archived'];
      
      if (itemType === 'lost') {
        // Lost items (ของหาย):
        // active -> matched (พบของที่ตรงกัน) หรือ returned (ได้ของคืนแล้ว)
        if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
        // matched -> returned (ได้ของคืนแล้ว)
        if (currentStatus === 'matched') return ['returned', 'archived'];
      } else {
        // Found items (ของพบ):
        // active -> matched (พบเจ้าของ) หรือ returned (คืนของให้เจ้าของแล้ว)
        if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
        // matched -> returned (คืนของให้เจ้าของแล้ว)
        if (currentStatus === 'matched') return ['returned', 'archived'];
      }
      return [];
    };
    
    const allowedTransitions = getAllowedTransitions(item.type, currentStatus);

    // Check if transition is allowed
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถเปลี่ยนสถานะจาก "${currentStatus}" เป็น "${status}" ได้`
      });
    }

    // Business logic for status changes
    const updates = { status };

    // If changing to matched, set matched_with_id
    if (status === 'matched' && matchedWithId) {
      updates.matched_with_id = matchedWithId;
      
      // Also update the matched item to matched status
      try {
        const matchedItem = await Item.findById(matchedWithId);
        if (matchedItem && matchedItem.status === 'active') {
          await Item.update(matchedWithId, { 
            status: 'matched',
            matched_with_id: item.id
          });
        }
      } catch (error) {
        console.error('Error updating matched item:', error);
        // Continue even if updating matched item fails
      }
    }

    // If changing to returned, also update matched item if exists
    if (status === 'returned' && item.matched_with_id) {
      try {
        const matchedItem = await Item.findById(item.matched_with_id);
        if (matchedItem && matchedItem.status === 'matched') {
          await Item.update(item.matched_with_id, { status: 'returned' });
        }
      } catch (error) {
        console.error('Error updating matched item to returned:', error);
        // Continue even if updating matched item fails
      }
    }

    const updatedItem = await Item.update(req.params.id, updates);

    res.json({
      success: true,
      item: updatedItem
    });
  } catch (error) {
    console.error('updateStatus error:', error);
    next(error);
  }
};

// @desc    ดูของของฉัน
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

// @desc    ดูของที่อาจตรงกัน
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

    // Find potential matches (same category, opposite type)
    const oppositeType = item.type === 'lost' ? 'found' : 'lost';
    // Exclude current user's items if logged in
    const excludeOwnerId = req.user ? req.user.id : null;
    const allItems = await Item.findAll({ category: item.category, type: oppositeType, status: 'active' }, 100, 0, 'created_at DESC', excludeOwnerId);
    
    // Filter by date range (within 30 days)
    const itemDate = new Date(item.date);
    const dateStart = new Date(itemDate);
    dateStart.setDate(dateStart.getDate() - 30);
    const dateEnd = new Date(itemDate);
    dateEnd.setDate(dateEnd.getDate() + 30);

    const matches = allItems
      .filter(matchItem => {
        if (matchItem.id === item.id) return false;
        const matchDate = new Date(matchItem.date);
        return matchDate >= dateStart && matchDate <= dateEnd;
      })
      .slice(0, 10)
      .map(matchItem => ({
        ...matchItem,
        owner: {
          id: matchItem.owner_id,
          username: matchItem.owner_username
        },
        matchScore: 15 // Simple score for now
      }));

    res.json({
      success: true,
      matches
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

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('getStats error:', error);
    next(error);
  }
};

