import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  FiPackage, FiCheckCircle, FiAlertCircle, FiMessageCircle, 
  FiTrendingUp, FiClock 
} from 'react-icons/fi';
import ItemCard from '../components/Items/ItemCard';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [myItems, setMyItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        itemService.getMyItems(),
        itemService.getStats()
      ]);
      setMyItems(itemsRes.data.items);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeItems = myItems.filter(item => item.status === 'active').length;
  const matchedItems = myItems.filter(item => item.status === 'matched').length;
  const returnedItems = myItems.filter(item => item.status === 'returned').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.username}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">Total Items</p>
              <h3 className="text-3xl font-bold">{myItems.length}</h3>
            </div>
            <FiPackage className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 mb-1">Active</p>
              <h3 className="text-3xl font-bold">{activeItems}</h3>
            </div>
            <FiClock className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 mb-1">Matched</p>
              <h3 className="text-3xl font-bold">{matchedItems}</h3>
            </div>
            <FiAlertCircle className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 mb-1">Returned</p>
              <h3 className="text-3xl font-bold">{returnedItems}</h3>
            </div>
            <FiCheckCircle className="w-12 h-12 text-teal-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/post" className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Post New Item</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Report a lost or found item
            </p>
          </div>
        </Link>

        <Link to="/my-items" className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">My Items</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View and manage your posts
            </p>
          </div>
        </Link>

        <Link to="/chat" className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.checkMessages')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('chat.noMessages')}
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('dashboard.recentActivity')}</h2>
          <Link to="/my-items" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('home.recentItems.viewAll')} →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : myItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myItems.slice(0, 6).map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('items.myItems.noItems')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by posting your first lost or found item
            </p>
            <Link to="/post" className="btn-primary inline-block">
              Post Item
            </Link>
          </div>
        )}
      </div>

      {/* Community Stats */}
      {stats && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Community Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600">{stats.totalItems}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Items</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{stats.returnedItems}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Successfully Returned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{stats.activeItems}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{stats.successRate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Success Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


