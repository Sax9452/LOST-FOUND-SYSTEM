import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import { FiPlusCircle, FiCheckCircle, FiSearch, FiArrowRight } from 'react-icons/fi';
import ItemCard from '../components/Items/ItemCard';
import Hero from '../components/Home/Hero';

const Home = () => {
  const { t } = useTranslation();
  const [recentItems, setRecentItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        itemService.getItems({ limit: 8, status: 'active', includeOwn: 'true' }),
        itemService.getStats()
      ]);
      setRecentItems(itemsRes.data.items || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      // Silent error for better UX on initial load if backend is down
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Hero />

      {/* Stats Section */}
      {stats && (
        <section className="relative -mt-20 z-20 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
              <div className="p-4 md:p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mb-3">
                  {stats.total_items || 0}
                </div>
                <div className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('home.stats.totalItems')}</div>
              </div>
              <div className="p-4 md:p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400 mb-3">
                  {stats.returned_items || 0}
                </div>
                <div className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('home.stats.foundItems')}</div>
              </div>
              <div className="p-4 md:p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 mb-3">
                  {stats.active_items || 0}
                </div>
                <div className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('home.stats.activeUsers')}</div>
              </div>
              <div className="p-4 md:p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400 mb-3">
                  {stats.successRate || 0}%
                </div>
                <div className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('home.stats.successRate')}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
              {t('home.features.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
              We provide the best tools to help you reunite with your lost belongings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            <div className="group text-center p-8 md:p-10 rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-2xl transition-all duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <FiPlusCircle className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('home.features.postItems.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                {t('home.features.postItems.description')}
              </p>
            </div>
            <div className="group text-center p-8 md:p-10 rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 hover:border-secondary-200 dark:hover:border-secondary-800 hover:shadow-2xl transition-all duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900/40 dark:to-secondary-800/40 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <FiSearch className="w-12 h-12 text-secondary-600 dark:text-secondary-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('home.features.smartSearch.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                {t('home.features.smartSearch.description')}
              </p>
            </div>
            <div className="group text-center p-8 md:p-10 rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 hover:shadow-2xl transition-all duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <FiCheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('home.features.secureChat.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                {t('home.features.secureChat.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 md:mb-16">
            <div className="mb-4 md:mb-0">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-gray-900 dark:text-white">{t('home.recentItems.title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">Latest items reported by our community</p>
            </div>
            <Link to="/search" className="hidden md:flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-semibold group transition-colors">
              <span>{t('home.recentItems.viewAll')}</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {recentItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
              <div className="mt-10 md:mt-12 text-center md:hidden">
                <Link to="/search" className="btn-outline w-full max-w-xs mx-auto justify-center">
                  {t('home.recentItems.viewAll')}
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 md:py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiSearch className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('home.recentItems.noItems')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
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
