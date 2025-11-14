import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome } from 'react-icons/fi';

const NotFound = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">{t('notFound.title')}</h1>
        <h2 className="text-3xl font-semibold mt-4 mb-2">{t('notFound.heading')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t('notFound.message')}
        </p>
        <Link to="/" className="btn-primary inline-flex items-center">
          <FiHome className="mr-2" />
          {t('notFound.backToHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
