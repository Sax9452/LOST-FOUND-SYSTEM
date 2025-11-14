import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import ItemCard from '../components/Items/ItemCard';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const Search = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    sort: 'created_at DESC'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const CATEGORIES = [
    { value: 'electronics', label: t('items.category.electronics') },
    { value: 'documents', label: t('items.category.documents') },
    { value: 'accessories', label: t('items.category.accessories') },
    { value: 'bags', label: t('items.category.bags') },
    { value: 'clothing', label: t('items.category.clothing') },
    { value: 'keys', label: t('items.category.keys') },
    { value: 'wallet', label: t('items.category.wallet') },
    { value: 'other', label: t('items.category.other') }
  ];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        status: 'active',
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] || key === 'sort') delete params[key];
      });

      const response = await itemService.getItems(params);
      setItems(response.data.items || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching items:', error);
      const errorMessage = error.response?.data?.message || t('items.search.noResults');
      toast.error(errorMessage);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchItems();
      return;
    }

    setLoading(true);
    try {
      const params = {
        q: searchQuery,
        page: currentPage,
        limit: 12,
        ...filters
      };

      Object.keys(params).forEach(key => {
        if (!params[key] || key === 'sort') delete params[key];
      });

      const response = await itemService.searchItems(params);
      setItems(response.data.items || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error searching items:', error);
      const errorMessage = error.response?.data?.message || t('items.search.noResults');
      toast.error(errorMessage);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', category: '', location: '', dateFrom: '', dateTo: '', sort: 'created_at DESC' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('items.search.title')}</h1>

      {/* Search Bar */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
              placeholder={t('items.search.searchByKeyword')}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-primary">
            {t('items.search.searchButton')}
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FiFilter className="mr-2" />
            {t('items.search.filters')}
          </button>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('items.search.type')}</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('items.search.all')}</option>
                  <option value="lost">{t('items.type.lost')}</option>
                  <option value="found">{t('items.type.found')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('items.search.category')}</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('items.search.allCategories')}</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('items.search.location')}</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="input-field"
                  placeholder={t('items.search.locationPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('items.search.dateFrom')}</label>
                <DatePicker
                  selected={filters.dateFrom ? new Date(filters.dateFrom) : null}
                  onChange={(date) => handleFilterChange('dateFrom', date ? date.toISOString().split('T')[0] : '')}
                  className="input-field w-full"
                  dateFormat="yyyy-MM-dd"
                  maxDate={new Date()}
                  placeholderText={t('items.search.selectDate')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('items.search.dateTo')}</label>
                <DatePicker
                  selected={filters.dateTo ? new Date(filters.dateTo) : null}
                  onChange={(date) => handleFilterChange('dateTo', date ? date.toISOString().split('T')[0] : '')}
                  className="input-field w-full"
                  dateFormat="yyyy-MM-dd"
                  maxDate={new Date()}
                  minDate={filters.dateFrom ? new Date(filters.dateFrom) : null}
                  placeholderText={t('items.search.selectDate')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('items.search.sortBy')}</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input-field"
                >
                  <option value="created_at DESC">{t('items.search.newestFirst')}</option>
                  <option value="created_at ASC">{t('items.search.oldestFirst')}</option>
                  <option value="date DESC">{t('items.search.mostRecentDate')}</option>
                </select>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="mt-4 text-primary-600 hover:text-primary-700 flex items-center text-sm"
            >
              <FiX className="mr-1" />
              {t('items.search.clearAllFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="mb-4 text-gray-600 dark:text-gray-400">
            {t('items.search.showingResults', { count: pagination?.totalItems || items.length })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {items.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary"
              >
                {t('items.search.previous')}
              </button>
              
              <span className="flex items-center px-4">
                {t('items.search.page', { current: currentPage, total: pagination.totalPages })}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="btn-secondary"
              >
                {t('items.search.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('items.search.noItemsFound')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
