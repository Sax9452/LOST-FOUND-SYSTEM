import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import ItemCard from '../components/Items/ItemCard';
import { FiFilter, FiX } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const Items = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    status: 'active', // Default to active items
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

  const STATUS_OPTIONS = [
    { value: 'active', label: t('items.status.active') },
    { value: 'pending', label: t('items.status.pending') },
    { value: 'matched', label: t('items.status.matched') },
    { value: 'returned', label: t('items.status.returned') },
    { value: 'archived', label: t('items.status.archived') }
  ];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.type, filters.category, filters.location, filters.dateFrom, filters.dateTo, filters.status, filters.sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ 
      type: '', 
      category: '', 
      location: '', 
      dateFrom: '', 
      dateTo: '', 
      status: 'active',
      sort: 'created_at DESC' 
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-16 md:pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 animate-fade-in">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3">{t('items.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">{t('items.subtitle')}</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="glass rounded-3xl p-6 md:p-8 mb-10 md:mb-12 animate-slide-up shadow-xl border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('items.filters')}</h2>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center px-6 py-3.5 md:py-4 text-base font-semibold transition-all ${showFilters ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700' : ''}`}
            >
              <FiFilter className="mr-2" />
              {t('items.search.filters')}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t-2 border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items.search.type')}</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items.search.category')}</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items.status.title', 'Status')}</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input-field"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items.search.location')}</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="input-field"
                    placeholder={t('items.search.locationPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items.search.dateFrom')}</label>
                  <DatePicker
                    selected={filters.dateFrom ? new Date(filters.dateFrom) : null}
                    onChange={(date) => handleFilterChange('dateFrom', date ? date.toISOString().split('T')[0] : '')}
                    className="input-field w-full"
                    dateFormat="yyyy-MM-dd"
                    maxDate={new Date()}
                    placeholderText={t('items.search.selectDate')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items.search.dateTo')}</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items.search.sortBy')}</label>
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

              <div className="mt-6 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium hover:underline"
                >
                  <FiX className="mr-1" />
                  {t('items.search.clearAllFilters')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner border-primary-500 border-t-transparent"></div>
          </div>
        ) : items.length > 0 ? (
          <div className="animate-slide-up animate-delay-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('items.search.showingResults', { count: pagination?.totalItems || items.length })}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-12">
              {items.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  {t('items.search.previous')}
                </button>

                <div className="flex items-center px-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  {t('items.search.page', { current: currentPage, total: pagination.totalPages })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  {t('items.search.next')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 animate-fade-in">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiFilter className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('items.search.noItemsFound')}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {t('items.noItemsFound')}
            </p>
            <button onClick={clearFilters} className="btn-primary mt-6">
              {t('items.clearFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Items;

