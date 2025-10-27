import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { adminService } from '../api/services';
import toast from 'react-hot-toast';
import { FiUsers, FiPackage, FiMessageCircle, FiGrid, FiCheck, FiX } from 'react-icons/fi';

const AdminPanel = () => {
  const location = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminService.getDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <nav className="space-y-2">
              <Link
                to="/admin"
                className={`flex items-center p-3 rounded-lg transition ${
                  location.pathname === '/admin'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiGrid className="w-5 h-5 mr-3" />
                Dashboard
              </Link>
              <Link
                to="/admin/pending"
                className={`flex items-center p-3 rounded-lg transition ${
                  isActive('/pending')
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiPackage className="w-5 h-5 mr-3" />
                Pending Items
                {dashboard?.stats?.pendingItems > 0 && (
                  <span className="ml-auto badge badge-warning">
                    {dashboard.stats.pendingItems}
                  </span>
                )}
              </Link>
              <Link
                to="/admin/users"
                className={`flex items-center p-3 rounded-lg transition ${
                  isActive('/users')
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiUsers className="w-5 h-5 mr-3" />
                Users
              </Link>
              <Link
                to="/admin/reports"
                className={`flex items-center p-3 rounded-lg transition ${
                  isActive('/reports')
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiMessageCircle className="w-5 h-5 mr-3" />
                Reported Chats
                {dashboard?.stats?.reportedChats > 0 && (
                  <span className="ml-auto badge badge-danger">
                    {dashboard.stats.reportedChats}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Routes>
            <Route index element={<DashboardView dashboard={dashboard} loading={loading} />} />
            <Route path="pending" element={<PendingItems />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="reports" element={<ReportedChats />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ dashboard, loading }) => {
  if (loading || !dashboard) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  const { stats, itemsByCategory, recentItems } = dashboard;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Users</p>
          <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Items</p>
          <h3 className="text-2xl font-bold">{stats.totalItems}</h3>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Pending</p>
          <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingItems}</h3>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Returned</p>
          <h3 className="text-2xl font-bold text-green-600">{stats.returnedItems}</h3>
        </div>
      </div>

      {/* Items by Category */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Items by Category</h2>
        <div className="space-y-2">
          {itemsByCategory.map((cat) => (
            <div key={cat.category} className="flex items-center justify-between">
              <span>{cat.category}</span>
              <div className="flex items-center gap-4">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(cat.count / stats.totalItems) * 100}%` }}
                  ></div>
                </div>
                <span className="font-medium w-8 text-right">{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Items */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Owner</th>
              </tr>
            </thead>
            <tbody>
              {recentItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3">
                    <span className={item.type === 'lost' ? 'text-red-600' : 'text-green-600'}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="badge badge-info">{item.status}</span>
                  </td>
                  <td className="py-3">{item.owner.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PendingItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const response = await adminService.getPendingItems();
      setItems(response.data.items);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveItem(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success('Item approved');
    } catch (error) {
      toast.error('Failed to approve item');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await adminService.rejectItem(id, { reason });
      setItems(items.filter((item) => item.id !== id));
      toast.success('Item rejected');
    } catch (error) {
      toast.error('Failed to reject item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Pending Items</h2>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              {item.images?.[0] && (
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.images[0]}`}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.category}</p>
                <p className="text-sm">By: {item.owner.username}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(item.id)}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <FiCheck />
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <FiX />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400 py-8">No pending items</p>
      )}
    </div>
  );
};

const UsersManagement = () => {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Users Management</h2>
      <p className="text-gray-600 dark:text-gray-400">
        User management features coming soon...
      </p>
    </div>
  );
};

const ReportedChats = () => {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Reported Chats</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Reported chats management coming soon...
      </p>
    </div>
  );
};

export default AdminPanel;


