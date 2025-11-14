import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import { FiSearch, FiPlusCircle, FiBell, FiCheckCircle } from 'react-icons/fi';
import ItemCard from '../components/Items/ItemCard';
import toast from 'react-hot-toast';

const Home = () => {
  const { t } = useTranslation();
  const [recentItems, setRecentItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        itemService.getItems({ limit: 6, status: 'active' }),
        itemService.getStats()
      ]);
      setRecentItems(itemsRes.data.items || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load data';
      toast.error(errorMessage);
      setRecentItems([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl mb-8 text-primary-100 animate-slide-in">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in">
              <Link to="/search" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                <FiSearch className="inline mr-2" />
                {t('nav.search')}
              </Link>
              <Link to="/post" className="btn-outline border-white text-white hover:bg-white/10">
                <FiPlusCircle className="inline mr-2" />
                {t('nav.postItem')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.features.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPlusCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.postItems.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.features.postItems.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBell className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.smartSearch.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.features.smartSearch.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.features.secureChat.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.features.secureChat.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary-600">{stats.total_items || 0}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{t('home.stats.totalItems')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600">{stats.returned_items || 0}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{t('home.stats.foundItems')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">{stats.active_items || 0}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{t('home.stats.activeUsers')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600">{stats.successRate || 0}%</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{t('home.stats.successRate')}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Items Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">{t('home.recentItems.title')}</h2>
            <Link to="/search" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('home.recentItems.viewAll')} →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('home.recentItems.noItems')}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
