/**
 * In-Memory Storage for Items
 */

const { v4: uuidv4 } = require('uuid');

const items = new Map(); // key: itemId, value: item object
const itemsByOwner = new Map(); // key: ownerId, value: Set of itemIds

const ItemStorage = {
  create(itemData) {
    const id = uuidv4();
    const now = new Date();
    
    const item = {
      id,
      type: itemData.type,
      name: itemData.name,
      description: itemData.description,
      category: itemData.category,
      date: itemData.date,
      location: itemData.location,
      latitude: itemData.latitude || null,
      longitude: itemData.longitude || null,
      images: itemData.images || [],
      status: itemData.status || 'active',
      owner_id: itemData.owner_id,
      matched_with_id: null,
      views: 0,
      keywords: itemData.keywords || [],
      rejection_reason: null,
      created_at: now,
      updated_at: now
    };

    items.set(id, item);
    
    // Index by owner
    if (!itemsByOwner.has(itemData.owner_id)) {
      itemsByOwner.set(itemData.owner_id, new Set());
    }
    itemsByOwner.get(itemData.owner_id).add(id);

    return item;
  },

  findAll(filters = {}, limit = 12, offset = 0, orderBy = 'created_at DESC', excludeOwnerId = null) {
    let results = Array.from(items.values());

    // Apply filters
    if (filters.type) {
      results = results.filter(item => item.type === filters.type);
    }
    if (filters.category) {
      results = results.filter(item => item.category === filters.category);
    }
    if (filters.status) {
      results = results.filter(item => item.status === filters.status);
    }
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      results = results.filter(item => 
        item.location && item.location.toLowerCase().includes(locationLower)
      );
    }
    if (filters.dateFrom || filters.dateTo) {
      results = results.filter(item => {
        const itemDate = new Date(item.date);
        if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && itemDate > new Date(filters.dateTo)) return false;
        return true;
      });
    }
    
    // Exclude items owned by the current user if excludeOwnerId is provided
    if (excludeOwnerId) {
      results = results.filter(item => item.owner_id !== excludeOwnerId);
    }

    // Sort
    const [sortColumn, sortDirection] = orderBy.split(' ');
    results.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      
      if (sortDirection === 'ASC') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Paginate
    const paginated = results.slice(offset, offset + limit);
    
    // Join with user data (from UserStorage)
    return paginated.map(item => ({
      ...item,
      owner_username: 'User' // Will be populated from User model
    }));
  },

  findById(id) {
    return items.get(id) || null;
  },

  search(searchTerm, filters = {}, excludeOwnerId = null) {
    let results = Array.from(items.values());
    const term = searchTerm.toLowerCase();

    // Search in name and description
    results = results.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );

    // Apply filters
    if (filters.type) {
      results = results.filter(item => item.type === filters.type);
    }
    if (filters.category) {
      results = results.filter(item => item.category === filters.category);
    }
    
    // Exclude items owned by the current user if excludeOwnerId is provided
    if (excludeOwnerId) {
      results = results.filter(item => item.owner_id !== excludeOwnerId);
    }

    // Sort by created_at DESC
    results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return results.map(item => ({
      ...item,
      owner_username: 'User'
    }));
  },

  update(id, updates) {
    const item = items.get(id);
    if (!item) return null;

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        item[key] = updates[key];
      }
    });

    item.updated_at = new Date();
    items.set(id, item);
    return item;
  },

  delete(id) {
    const item = items.get(id);
    if (item) {
      // Remove from owner index
      const ownerItems = itemsByOwner.get(item.owner_id);
      if (ownerItems) {
        ownerItems.delete(id);
      }
      items.delete(id);
      return true;
    }
    return false;
  },

  findByOwner(ownerId) {
    const ownerItems = itemsByOwner.get(ownerId);
    if (!ownerItems) return [];

    return Array.from(ownerItems)
      .map(id => items.get(id))
      .filter(Boolean)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  },

  incrementViews(id) {
    const item = items.get(id);
    if (item) {
      item.views = (item.views || 0) + 1;
      items.set(id, item);
    }
  },

  getStats() {
    const allItems = Array.from(items.values());
    return {
      total_items: allItems.length,
      returned_items: allItems.filter(i => i.status === 'returned').length,
      active_items: allItems.filter(i => i.status === 'active').length,
      lost_items: allItems.filter(i => i.type === 'lost' && i.status === 'active').length,
      found_items: allItems.filter(i => i.type === 'found' && i.status === 'active').length,
      successRate: allItems.length > 0 
        ? Math.round((allItems.filter(i => i.status === 'returned').length / allItems.length) * 100)
        : 0
    };
  },

  clear() {
    items.clear();
    itemsByOwner.clear();
  },

  count() {
    return items.size;
  }
};

module.exports = ItemStorage;

