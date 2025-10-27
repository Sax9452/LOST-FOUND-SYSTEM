import React, { useState, useEffect, useCallback } from 'react';
import { itemService } from '../api/services';
import ItemCard from '../components/Items/ItemCard';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'documents', label: 'Documents' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'bags', label: 'Bags' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'keys', label: 'Keys' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' }
];

const Search = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    sort: 'created_at DESC'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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
        if (!params[key]) delete params[key];
      });

      const response = await itemService.getItems(params);
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

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
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', category: '', sort: 'created_at DESC' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Items</h1>

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
              placeholder="Search by keyword..."
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FiFilter className="mr-2" />
            Filters
          </button>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="input-field"
                >
                  <option value="">All</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input-field"
                >
                  <option value="created_at DESC">Newest First</option>
                  <option value="created_at ASC">Oldest First</option>
                  <option value="date DESC">Most Recent Date</option>
                </select>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="mt-4 text-primary-600 hover:text-primary-700 flex items-center text-sm"
            >
              <FiX className="mr-1" />
              Clear all filters
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
            Showing {pagination?.totalItems || 0} results
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
                Previous
              </button>
              
              <span className="flex items-center px-4">
                Page {currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No items found. Try different search terms or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;


