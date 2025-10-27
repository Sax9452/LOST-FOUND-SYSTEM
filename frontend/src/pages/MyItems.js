import React, { useState, useEffect } from 'react';
import { itemService } from '../api/services';
import ItemCard from '../components/Items/ItemCard';
import { FiFilter } from 'react-icons/fi';

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [filter, items]);

  const fetchMyItems = async () => {
    try {
      const response = await itemService.getMyItems();
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (filter === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.status === filter));
    }
  };

  const statusCounts = {
    all: items.length,
    pending: items.filter(item => item.status === 'pending').length,
    active: items.filter(item => item.status === 'active').length,
    matched: items.filter(item => item.status === 'matched').length,
    returned: items.filter(item => item.status === 'returned').length
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Items</h1>

      {/* Filter Tabs */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-gray-600 dark:text-gray-400" />
          <span className="font-medium">Filter by Status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(statusCounts).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No items found with status: {filter}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyItems;


