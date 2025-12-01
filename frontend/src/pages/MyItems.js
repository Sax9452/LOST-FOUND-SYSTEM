import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import ItemCard from '../components/Items/ItemCard';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyItems = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterItems = useCallback(() => {
    if (filter === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.status === filter));
    }
  }, [filter, items]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const fetchMyItems = async () => {
    try {
      const response = await itemService.getMyItems();
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      const errorMessage = error.response?.data?.message || t('items.myItems.noItemsFound');
      toast.error(errorMessage);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = {
    all: items.length,
    pending: items.filter(item => item.status === 'pending').length,
    active: items.filter(item => item.status === 'active').length,
    matched: items.filter(item => item.status === 'matched').length,
    returned: items.filter(item => item.status === 'returned').length
  };

  const getStatusLabel = (status) => {
    return t(`items.myItems.${status}`, status);
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('items.myItems.title')}</h1>
        <Link to="/post" className="btn-primary">
          {t('items.myItems.postNewItem')}
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'active', 'pending', 'matched', 'returned'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {getStatusLabel(status)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            {t('items.myItems.noItemsFound')}
          </p>
          <Link to="/post" className="btn-primary inline-block">
            {t('items.myItems.postFirstItem')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyItems;
