import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMapPin, FiTag, FiImage, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { useTranslateItem } from '../../hooks/useTranslate';

const ItemCard = ({ item }) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { translatedName, translatedDescription, translatedLocation } = useTranslateItem(item);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-gray-100 text-black dark:bg-gray-700 dark:text-white ring-gray-300 dark:ring-gray-600';
      case 'pending': return 'badge-warning';
      case 'matched': return 'badge-info';
      case 'returned': return 'badge-success';
      default: return 'badge';
    }
  };

  const getTypeColor = (type) => {
    return type === 'lost' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-black bg-gray-100 dark:bg-gray-700 dark:text-white';
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
  };

  return (
    <Link to={`/items/${item.id}`} className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
      {/* Image Area */}
      <div className="relative h-56 md:h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {item.images && item.images.length > 0 && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-10">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={getImageUrl(item.images[0])}
              alt={item.name}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {item.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                <FiImage className="w-3 h-3" />
                <span>{item.images.length}</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800/50">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
              <FiTag className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">{t('items.details.noImage')}</span>
          </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm ${getTypeColor(item.type)}`}>
            {t(`items.type.${item.type}`)}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <span className={`badge ${getStatusColor(item.status)} shadow-lg backdrop-blur-md bg-opacity-95`}>
            {t(`items.status.${item.status}`, item.status)}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
            {translatedName || item.name}
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed min-h-[3rem]">
            {translatedDescription || item.description}
          </p>
        </div>

        <div className="mt-auto space-y-3 pt-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
              <FiTag className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="truncate font-medium">{t(`items.category.${item.category}`, item.category)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <div className="w-9 h-9 rounded-xl bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
              <FiMapPin className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
            </div>
            <span className="truncate font-medium">{translatedLocation || item.location}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <FiClock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="font-medium">{format(new Date(item.date), 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;


