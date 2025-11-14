import React from 'react';
import { Link } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi';

const AdminPanel = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <FiInfo className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Admin Panel Feature Temporarily Unavailable
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              The admin panel feature is currently disabled. This application now focuses on authentication only.
            </p>
            <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
