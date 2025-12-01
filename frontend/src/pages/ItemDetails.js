import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemService, chatService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiTag, FiUser, FiMessageCircle, FiEdit, FiTrash2, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { format } from 'date-fns';
import { useTranslateItem } from '../hooks/useTranslate';

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
  const { translatedName, translatedDescription, translatedLocation } = useTranslateItem(item);

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

    if (!item || !item.owner_id) {
      toast.error(t('items.details.itemNotFound'));
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
      <div className="container mx-auto px-4 pt-28 pb-8">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back Link */}
        <Link
          to="/search"
          className="inline-flex items-center text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-8 transition-colors group"
        >
          <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          {t('items.details.backToSearch')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Images */}
          <div className="space-y-6 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg aspect-square group">
              {item.images && item.images.length > 0 ? (
                <>
                  <img
                    src={getImageUrl(item.images[selectedImage])}
                    alt={translatedName || item.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${item.type === 'lost'
                        ? 'bg-red-500/90 text-white'
                        : 'bg-gray-100 text-black dark:bg-gray-700 dark:text-white'
                      }`}>
                      {t(`items.type.${item.type}`)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`badge ${item.status === 'active' ? 'bg-gray-100 text-black dark:bg-gray-700 dark:text-white ring-gray-300 dark:ring-gray-600' : 'badge-warning'} shadow-lg backdrop-blur-md`}>
                      {t(`items.status.${item.status}`, item.status)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800">
                  <FiTag className="w-24 h-24 mb-4 opacity-50" />
                  <span className="text-lg font-medium">{t('items.details.noImage')}</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {item.images && item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-200 ${selectedImage === index
                        ? 'border-primary-600 ring-2 ring-primary-600/20 scale-95'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${translatedName || item.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="animate-slide-up animate-delay-100">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                    {translatedName || item.name}
                  </h1>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <FiCalendar className="mr-2" />
                    <span>Posted on {format(new Date(item.created_at || item.date), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Link
                      to={`/items/${id}/edit`}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                      title={t('items.details.edit')}
                    >
                      <FiEdit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                      title={t('items.details.delete')}
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>{translatedDescription || item.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 mr-4">
                    <FiTag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('items.search.category')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {t(`items.category.${item.category}`)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="p-3 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 mr-4">
                    <FiMapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('items.search.location')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {translatedLocation || item.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 mr-4">
                    <FiCalendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('items.details.dateLostFound')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {format(new Date(item.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 mr-4">
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('items.details.postedBy')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.owner_username || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-8">
                {isOwner ? (
                  <button
                    onClick={() => {
                      // Logic for status update modal (same as before)
                      const getAllowedStatuses = (itemType, currentStatus) => {
                        if (currentStatus === 'archived') return [];
                        if (currentStatus === 'pending') return ['active', 'archived'];
                        if (currentStatus === 'returned') return ['archived'];

                        if (itemType === 'lost') {
                          if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
                          if (currentStatus === 'matched') return ['returned', 'archived'];
                        } else {
                          if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
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
                    className="btn-primary w-full flex items-center justify-center py-4 text-lg shadow-lg shadow-primary-600/20"
                    disabled={item.status === 'archived'}
                  >
                    <FiCheck className="w-5 h-5 mr-2" />
                    {t('items.details.updateStatus')}
                  </button>
                ) : isAuthenticated ? (
                  <button
                    onClick={handleContact}
                    className="btn-primary w-full flex items-center justify-center py-4 text-lg shadow-lg shadow-primary-600/20"
                  >
                    <FiMessageCircle className="w-5 h-5 mr-2" />
                    {t('items.details.contactOwner')}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="btn-primary w-full flex items-center justify-center py-4 text-lg shadow-lg shadow-primary-600/20"
                  >
                    {t('items.details.loginToContact')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Potential Matches Section */}
        {matches.length > 0 && (
          <div className="mt-16 animate-slide-up animate-delay-200">
            <h2 className="text-2xl font-bold mb-8 flex items-center">
              <span className="w-2 h-8 bg-secondary-500 rounded-full mr-3"></span>
              {t('items.details.potentialMatches')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {matches.map(match => (
                <Link
                  key={match.id}
                  to={`/items/${match.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
                    {match.images && match.images.length > 0 ? (
                      <img
                        src={getImageUrl(match.images[0])}
                        alt={match.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiTag className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {match.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {match.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Modals (Status & Delete) - Keeping logic same, just styling updates if needed */}
        {/* Status Update Modal */}
        {showStatusModal && item && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('items.details.updateStatusTitle')}</h3>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('items.details.selectStatus')}</label>
                  <select
                    value={newStatus}
                    onChange={(e) => {
                      setNewStatus(e.target.value);
                      setMatchedWithId(null);
                    }}
                    className="input-field w-full"
                  >
                    {(() => {
                      const getAllowedStatuses = (itemType, currentStatus) => {
                        // Allow unarchiving: archived -> active (to reopen the listing)
                        if (currentStatus === 'archived') return ['active'];
                        
                        if (currentStatus === 'pending') return ['active', 'archived'];
                        if (currentStatus === 'returned') return ['archived'];

                        if (itemType === 'lost') {
                          if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
                          if (currentStatus === 'matched') return ['returned', 'archived'];
                        } else {
                          if (currentStatus === 'active') return ['matched', 'returned', 'archived'];
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
                          {t(`items.status.${status}`, status)}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {newStatus === 'matched' && matches.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
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
                }} className="btn-ghost flex-1">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <FiTrash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">{t('items.details.confirmDeleteTitle')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
                {t('items.details.confirmDeleteMessage')}
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="btn-ghost flex-1">
                  {t('items.details.cancel')}
                </button>
                <button onClick={handleDelete} className="btn-primary flex-1 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700">
                  {t('items.details.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetails;
