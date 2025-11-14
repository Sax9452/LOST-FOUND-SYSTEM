import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemService, chatService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiTag, FiUser, FiMessageCircle, FiEdit, FiTrash2, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { format } from 'date-fns';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [matchedWithId, setMatchedWithId] = useState(null);

  useEffect(() => {
    fetchItemDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await itemService.getItemById(id);
      setItem(response.data.item);
      
      // Fetch potential matches if authenticated
      if (isAuthenticated) {
        try {
          const matchesRes = await itemService.getPotentialMatches(id);
          setMatches(matchesRes.data.matches || []);
        } catch (error) {
          console.error('Error fetching matches:', error);
        }
      }
    } catch (error) {
      toast.error(t('items.details.itemNotFound'));
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      // Start chat with item owner
      const response = await chatService.startChat(item.owner_id);
      navigate(`/chat?room=${response.data.chatRoom.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      const errorMessage = error.response?.data?.message || t('items.details.failedToStartChat');
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await itemService.deleteItem(id);
      toast.success(t('items.details.itemDeletedSuccessfully'));
      navigate('/my-items');
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorMessage = error.response?.data?.message || t('items.details.failedToDeleteItem');
      toast.error(errorMessage);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const isOwner = isAuthenticated && user && item.owner_id === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/search" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
        <FiArrowLeft className="mr-2" />
        {t('items.details.backToSearch')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          {item.images && item.images.length > 0 ? (
            <div>
              <div className="w-full mb-4 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={getImageUrl(item.images[selectedImage])}
                  alt={item.name}
                  className="max-w-full max-h-[400px] w-auto h-auto object-contain rounded-lg"
                />
              </div>
              {item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all h-20 flex items-center justify-center ${
                        selectedImage === index ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${item.name} ${index + 1}`}
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">{t('items.details.noImage')}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
              <div className="flex items-center gap-2">
                <span className={`badge ${item.type === 'lost' ? 'badge-error' : 'badge-success'}`}>
                  {t(`items.type.${item.type}`).toUpperCase()}
                </span>
                <span className="badge badge-info">{t(`items.status.${item.status}`)}</span>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    // Get allowed statuses based on item type (lost/found) and current status
                    const getAllowedStatuses = (itemType, currentStatus) => {
                      if (currentStatus === 'archived') return [];
                      if (currentStatus === 'pending') return ['active', 'archived'];
                      if (currentStatus === 'returned') return ['archived'];
                      
                      if (itemType === 'lost') {
                        // Lost items (ของหาย):
                        // active -> matched (พบของที่ตรงกัน) หรือ returned (ได้ของคืนแล้ว)
                        if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
                        // matched -> returned (ได้ของคืนแล้ว)
                        if (currentStatus === 'matched') return ['returned', 'archived'];
                      } else {
                        // Found items (ของพบ):
                        // active -> matched (พบเจ้าของ) หรือ returned (คืนของให้เจ้าของแล้ว)
                        if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
                        // matched -> returned (คืนของให้เจ้าของแล้ว)
                        if (currentStatus === 'matched') return ['returned', 'archived'];
                      }
                      return [];
                    };
                    
                    const allowed = getAllowedStatuses(item.type, item.status);
                    if (allowed.length > 0) {
                      setNewStatus(allowed[0]);
                      setShowStatusModal(true);
                    } else {
                      toast.error(t('items.details.cannotChangeStatus'));
                    }
                  }}
                  className="btn-secondary"
                  disabled={item.status === 'archived'}
                >
                  <FiCheck className="w-4 h-4" />
                  {t('items.details.updateStatus')}
                </button>
                <Link to={`/items/${id}/edit`} className="btn-secondary">
                  <FiEdit className="w-4 h-4" />
                </Link>
                <button onClick={() => setShowDeleteModal(true)} className="btn-secondary text-red-600">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">{t('items.details.descriptionLabel')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <FiTag className="w-5 h-5 mr-2 text-gray-400" />
                <span>{t(`items.category.${item.category}`)}</span>
              </div>
              <div className="flex items-center">
                <FiCalendar className="w-5 h-5 mr-2 text-gray-400" />
                <span>{format(new Date(item.date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center col-span-2">
                <FiMapPin className="w-5 h-5 mr-2 text-gray-400" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center">
                <FiUser className="w-5 h-5 mr-2 text-gray-400" />
                <span>{item.owner_username}</span>
              </div>
            </div>
          </div>

          {!isOwner && isAuthenticated && (
            <button onClick={handleContact} className="btn-primary w-full">
              <FiMessageCircle className="inline mr-2" />
              {t('items.details.contactOwner')}
            </button>
          )}

          {!isAuthenticated && (
            <Link to="/login" className="btn-primary w-full block text-center">
              {t('items.details.loginToContact')}
            </Link>
          )}
        </div>
      </div>

      {/* Potential Matches */}
      {matches.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{t('items.details.potentialMatches')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(match => (
              <Link
                key={match.id}
                to={`/items/${match.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold mb-2">{match.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {match.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{t('items.details.updateStatusTitle')}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{t('items.details.selectStatus')}</label>
              <select
                value={newStatus}
                onChange={(e) => {
                  setNewStatus(e.target.value);
                  setMatchedWithId(null);
                }}
                className="input-field w-full"
              >
                {(() => {
                  // Get allowed statuses based on item type (lost/found) and current status
                  const getAllowedStatuses = (itemType, currentStatus) => {
                    if (currentStatus === 'archived') return [];
                    if (currentStatus === 'pending') return ['active', 'archived'];
                    if (currentStatus === 'returned') return ['archived'];
                    
                    if (itemType === 'lost') {
                      // Lost items (ของหาย):
                      // active -> matched (พบของที่ตรงกัน) หรือ returned (ได้ของคืนแล้ว)
                      if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
                      // matched -> returned (ได้ของคืนแล้ว)
                      if (currentStatus === 'matched') return ['returned', 'archived'];
                    } else {
                      // Found items (ของพบ):
                      // active -> matched (พบเจ้าของ) หรือ returned (คืนของให้เจ้าของแล้ว)
                      if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
                      // matched -> returned (คืนของให้เจ้าของแล้ว)
                      if (currentStatus === 'matched') return ['returned', 'archived'];
                    }
                    return [];
                  };
                  
                  const allowed = getAllowedStatuses(item.type, item.status);
                  
                  if (allowed.length === 0) {
                    return <option value="">{t('items.details.noStatusChange')}</option>;
                  }
                  
                  return allowed.map(status => (
                    <option key={status} value={status}>
                      {t(`items.status.${status}`)}
                    </option>
                  ));
                })()}
              </select>
              
              {/* Show matched item selector if changing to matched */}
              {newStatus === 'matched' && matches.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    {t('items.details.selectMatchedItem')}
                  </label>
                  <select
                    value={matchedWithId || ''}
                    onChange={(e) => setMatchedWithId(e.target.value || null)}
                    className="input-field w-full"
                  >
                    <option value="">-- {t('items.details.selectMatchedItem')} --</option>
                    {matches.map(match => (
                      <option key={match.id} value={match.id}>
                        {match.name} ({t(`items.type.${match.type}`)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={() => {
                setShowStatusModal(false);
                setNewStatus('');
                setMatchedWithId(null);
              }} className="btn-secondary flex-1">
                {t('items.details.cancel')}
              </button>
              <button 
                onClick={async () => {
                  try {
                    const updateData = { status: newStatus };
                    if (newStatus === 'matched' && matchedWithId) {
                      updateData.matchedWithId = matchedWithId;
                    }
                    
                    await itemService.updateStatus(id, updateData);
                    toast.success(t('items.details.statusUpdatedSuccessfully'));
                    setItem({ ...item, status: newStatus });
                    setShowStatusModal(false);
                    setNewStatus('');
                    setMatchedWithId(null);
                    // Refresh item details to get updated data
                    fetchItemDetails();
                  } catch (error) {
                    console.error('Error updating status:', error);
                    toast.error(error.response?.data?.message || t('items.details.failedToUpdateStatus'));
                  }
                }} 
                className="btn-primary flex-1"
                disabled={!newStatus || (newStatus === 'matched' && !matchedWithId)}
              >
                {t('items.details.update')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{t('items.details.confirmDeleteTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('items.details.confirmDeleteMessage')}
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">
                {t('items.details.cancel')}
              </button>
              <button onClick={handleDelete} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">
                {t('items.details.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;
