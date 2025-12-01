/**
 * Item Model - MySQL Implementation
 */

const pool = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const ItemModel = {
  /**
   * Create a new item
   */
  async create(itemData) {
    const id = uuidv4();
    const now = new Date();

    const imagesJson = JSON.stringify(itemData.images || []);
    const keywordsJson = JSON.stringify(itemData.keywords || []);

    await pool.execute(
      `INSERT INTO items (
        id, type, name, description, category, date, location,
        latitude, longitude, images, status, owner_id, matched_with_id,
        views, keywords, rejection_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        itemData.type,
        itemData.name,
        itemData.description || null,
        itemData.category || null,
        itemData.date,
        itemData.location || null,
        itemData.latitude || null,
        itemData.longitude || null,
        imagesJson,
        itemData.status || 'active',
        itemData.owner_id,
        null,
        0,
        keywordsJson,
        null,
        now,
        now
      ]
    );

    return this.findById(id);
  },

  /**
   * Find all items with filters and pagination
   */
  async findAll(filters = {}, limit = 12, offset = 0, orderBy = 'created_at DESC', excludeOwnerId = null) {
    try {
      let query = `
        SELECT i.*, u.username as owner_username
        FROM items i
        LEFT JOIN users u ON i.owner_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.type) {
        query += ' AND i.type = ?';
        params.push(filters.type);
      }
      if (filters.category) {
        query += ' AND i.category = ?';
        params.push(filters.category);
      }
      if (filters.status) {
        query += ' AND i.status = ?';
        params.push(filters.status);
      }
      if (filters.location) {
        query += ' AND i.location LIKE ?';
        params.push(`%${filters.location}%`);
      }
      if (filters.dateFrom) {
        query += ' AND i.date >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        query += ' AND i.date <= ?';
        params.push(filters.dateTo);
      }
      if (excludeOwnerId) {
        query += ' AND i.owner_id != ?';
        params.push(excludeOwnerId);
      }

      // Order by
      const [sortColumn, sortDirection] = orderBy.split(' ');
      const validColumns = ['created_at', 'updated_at', 'date', 'views', 'name'];
      const validDirection = sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const column = validColumns.includes(sortColumn) ? sortColumn : 'created_at';
      query += ` ORDER BY i.${column} ${validDirection}`;

      // Pagination
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      // Only log in development (but not for COUNT queries to reduce noise)
      if (process.env.NODE_ENV === 'development' && !query.includes('COUNT(*)')) {
        console.log('Executing query:', query.substring(0, 200) + '...');
        console.log('With params:', params);
      }

      const [rows] = await pool.execute(query, params);
      
      return rows.map(item => {
        try {
          return {
            ...item,
            images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
            keywords: item.keywords ? (typeof item.keywords === 'string' ? JSON.parse(item.keywords) : item.keywords) : []
          };
        } catch (e) {
          console.error('Error parsing JSON for item:', item.id, e.message);
          return {
            ...item,
            images: [],
            keywords: []
          };
        }
      });
    } catch (error) {
      console.error('ItemModel.findAll error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      });
      throw error;
    }
  },

  /**
   * Find item by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT i.*, u.username as owner_username, u.email as owner_email, u.phone as owner_phone
       FROM items i
       LEFT JOIN users u ON i.owner_id = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const item = rows[0];
    if (!item) return null;
    
    try {
      return {
        ...item,
        images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
        keywords: item.keywords ? (typeof item.keywords === 'string' ? JSON.parse(item.keywords) : item.keywords) : []
      };
    } catch (e) {
      // If JSON parsing fails, return with empty arrays
      return {
        ...item,
        images: [],
        keywords: []
      };
    }
  },

  /**
   * Search items with pagination support
   */
  async search(searchTerm, filters = {}, excludeOwnerId = null, limit = null, offset = null) {
    let query = `
      SELECT i.*, u.username as owner_username
      FROM items i
      LEFT JOIN users u ON i.owner_id = u.id
      WHERE (i.name LIKE ? OR i.description LIKE ?)
    `;
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];

    // Filter by status (default to 'active' if not specified)
    if (filters.status) {
      query += ' AND i.status = ?';
      params.push(filters.status);
    } else {
      // Default to active items only
      query += ' AND i.status = ?';
      params.push('active');
    }

    if (filters.type) {
      query += ' AND i.type = ?';
      params.push(filters.type);
    }
    if (filters.category) {
      query += ' AND i.category = ?';
      params.push(filters.category);
    }
    if (excludeOwnerId) {
      query += ' AND i.owner_id != ?';
      params.push(excludeOwnerId);
    }

    query += ' ORDER BY i.created_at DESC';

    // Add pagination if provided
    if (limit !== null && offset !== null) {
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
    }

    const [rows] = await pool.execute(query, params);
    return rows.map(item => {
      try {
        return {
          ...item,
          images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
          keywords: item.keywords ? (typeof item.keywords === 'string' ? JSON.parse(item.keywords) : item.keywords) : []
        };
      } catch (e) {
        return {
          ...item,
          images: [],
          keywords: []
        };
      }
    });
  },

  /**
   * Update item
   */
  async update(id, updates) {
    const allowedFields = [
      'type', 'name', 'description', 'category', 'date', 'location',
      'latitude', 'longitude', 'images', 'status', 'matched_with_id',
      'keywords', 'rejection_reason'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        if (key === 'images' || key === 'keywords') {
          updateFields.push(`${key} = ?`);
          values.push(JSON.stringify(updates[key]));
        } else {
          updateFields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.execute(
      `UPDATE items SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return this.findById(id);
  },

  /**
   * Delete item
   */
  async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM items WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Find items by owner
   */
  async findByOwner(ownerId) {
    const [rows] = await pool.execute(
      'SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    return rows.map(item => {
      try {
        return {
          ...item,
          images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
          keywords: item.keywords ? (typeof item.keywords === 'string' ? JSON.parse(item.keywords) : item.keywords) : []
        };
      } catch (e) {
        return {
          ...item,
          images: [],
          keywords: []
        };
      }
    });
  },

  /**
   * Increment views
   */
  async incrementViews(id) {
    await pool.execute(
      'UPDATE items SET views = views + 1 WHERE id = ?',
      [id]
    );
  },

  /**
   * Count items with filters (for pagination)
   * Supports search term for search count
   */
  async count(filters = {}, excludeOwnerId = null) {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM items i
        WHERE 1=1
      `;
      const params = [];

      // Support search term if provided
      if (filters.searchTerm) {
        query += ' AND (i.name LIKE ? OR i.description LIKE ?)';
        params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
      }

      if (filters.type) {
        query += ' AND i.type = ?';
        params.push(filters.type);
      }
      if (filters.category) {
        query += ' AND i.category = ?';
        params.push(filters.category);
      }
      if (filters.status) {
        query += ' AND i.status = ?';
        params.push(filters.status);
      }
      if (filters.location) {
        query += ' AND i.location LIKE ?';
        params.push(`%${filters.location}%`);
      }
      if (filters.dateFrom) {
        query += ' AND i.date >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        query += ' AND i.date <= ?';
        params.push(filters.dateTo);
      }
      if (excludeOwnerId) {
        query += ' AND i.owner_id != ?';
        params.push(excludeOwnerId);
      }

      const [rows] = await pool.execute(query, params);
      const count = parseInt(rows[0].total) || 0;
      
      return count;
    } catch (error) {
      console.error('ItemModel.count error:', error);
      throw error;
    }
  },

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_items,
          COALESCE(SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END), 0) as returned_items,
          COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active_items,
          COALESCE(SUM(CASE WHEN type = 'lost' AND status = 'active' THEN 1 ELSE 0 END), 0) as lost_items,
          COALESCE(SUM(CASE WHEN type = 'found' AND status = 'active' THEN 1 ELSE 0 END), 0) as found_items
        FROM items
      `);

      const stats = rows[0] || {};
      const total = parseInt(stats.total_items) || 0;
      const returned = parseInt(stats.returned_items) || 0;

      return {
        total_items: total,
        returned_items: returned,
        active_items: parseInt(stats.active_items) || 0,
        lost_items: parseInt(stats.lost_items) || 0,
        found_items: parseInt(stats.found_items) || 0,
        successRate: total > 0 ? Math.round((returned / total) * 100) : 0
      };
    } catch (error) {
      console.error('getStats error:', error);
      // Return default stats if query fails
      return {
        total_items: 0,
        returned_items: 0,
        active_items: 0,
        lost_items: 0,
        found_items: 0,
        successRate: 0
      };
    }
  }
};

module.exports = ItemModel;

