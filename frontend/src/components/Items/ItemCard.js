import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiTag, FiImage } from 'react-icons/fi';
import { format } from 'date-fns';

const ItemCard = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'matched': return 'badge-info';
      case 'returned': return 'badge-success';
      default: return 'badge';
    }
  };

  const getTypeColor = (type) => {
    return type === 'lost' ? 'text-red-600' : 'text-green-600';
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // ถ้ามี http อยู่แล้ว ใช้เลย
    if (imagePath.startsWith('http')) return imagePath;
    // ถ้าไม่มี / ข้างหน้า เติมให้
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
  };

  return (
    <Link to={`/items/${item.id}`} className="card hover:shadow-lg transition-shadow duration-200 group flex flex-col h-full">
      {/* Image - ความสูงคงที่ 300px */}
      <div className="relative h-[300px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden mb-4 flex-shrink-0">
        {item.images && item.images.length > 0 && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}
            <img
              src={getImageUrl(item.images[0])}
              alt={item.name}
              className={`w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                console.error('Image failed to load:', item.images[0]);
                setImageError(true);
                setImageLoading(false);
              }}
            />
            {/* แสดงจำนวนรูปภาพถ้ามีมากกว่า 1 */}
            {item.images.length > 1 && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                <FiImage className="w-3 h-3" />
                <span>{item.images.length} รูป</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <FiTag className="w-16 h-16 mb-2" />
            <span className="text-sm">ไม่มีรูปภาพ</span>
          </div>
        )}
        <span className={`absolute top-2 right-2 badge ${getStatusColor(item.status)} shadow-lg`}>
          {item.status}
        </span>
      </div>

      {/* Content */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold line-clamp-1">{item.name}</h3>
          <span className={`text-sm font-medium ${getTypeColor(item.type)}`}>
            {item.type.toUpperCase()}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {item.description}
        </p>

        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <FiTag className="w-4 h-4 mr-2" />
            <span>{item.category}</span>
          </div>
          <div className="flex items-center">
            <FiMapPin className="w-4 h-4 mr-2" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
          <div className="flex items-center">
            <FiCalendar className="w-4 h-4 mr-2" />
            <span>{format(new Date(item.date), 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;


