import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemService, chatService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiTag, FiUser, FiMessageCircle, FiEdit, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
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

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await itemService.getItemById(id);
      setItem(response.data.item);
      
      // Fetch potential matches if authenticated
      if (isAuthenticated) {
        try {
          const matchesRes = await itemService.getPotentialMatches(id);
          setMatches(matchesRes.data.matches);
        } catch (error) {
          console.error('Error fetching matches:', error);
        }
      }
    } catch (error) {
      toast.error('Item not found');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start chat with item owner
   */
  const handleContact = async (e) => {
    if (e) e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to message the owner');
      navigate('/login');
      return;
    }

    if (isOwner) {
      toast.error('You cannot message yourself');
      return;
    }

    try {
      // Start or get existing chat with the owner
      const response = await chatService.startChat(item.owner.id);
      console.log('Chat started:', response.data.chatRoom);
      
      toast.success('Opening chat...');
      
      // Navigate to chat page
      navigate('/chat');
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleFoundOwner = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await itemService.deleteItem(item.id);
      const successMsg = item.type === 'lost' 
        ? 'ยินดีด้วย! เจอของแล้ว 🎉' 
        : 'ยินดีด้วย! คืนเจ้าของเรียบร้อยแล้ว 🎉';
      toast.success(successMsg);
      navigate('/my-items');
    } catch (error) {
      toast.error('ไม่สามารถลบรายการได้');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user && item.owner.id === user.id;
  const getStatusBadge = (status) => {
    const classes = {
      active: 'badge-success',
      pending: 'badge-warning',
      matched: 'badge-info',
      returned: 'badge-success'
    };
    return classes[status] || 'badge';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="card">
              {item.images && item.images.length > 0 ? (
                <>
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.images[selectedImage]}`}
                    alt={item.name}
                    className="w-full h-[500px] object-cover rounded-lg mb-4"
                  />
                  {item.images.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {item.images.map((img, index) => (
                        <img
                          key={index}
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${img}`}
                          alt={`${item.name} ${index + 1}`}
                          onClick={() => setSelectedImage(index)}
                          className={`w-full h-20 object-cover rounded cursor-pointer ${
                            selectedImage === index ? 'ring-2 ring-primary-600' : ''
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-[500px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <FiTag className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`badge ${getStatusBadge(item.status)} mb-2`}>
                    {item.status}
                  </span>
                  <h1 className="text-3xl font-bold">{item.name}</h1>
                  <span className={`text-lg font-medium ${
                    item.type === 'lost' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.type.toUpperCase()}
                  </span>
                </div>

                {isOwner && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleFoundOwner}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <span>
                        {item.type === 'lost' ? `✅ ${t('items.actions.foundItem')}` : `✅ ${t('items.actions.returnedOwner')}`}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiTag className="w-5 h-5 mr-3" />
                  <span>{item.category}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiMapPin className="w-5 h-5 mr-3" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiCalendar className="w-5 h-5 mr-3" />
                  <span>{format(new Date(item.date), 'MMMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiUser className="w-5 h-5 mr-3" />
                  <span>Posted by {item.owner.username}</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {!isOwner && isAuthenticated && (
                <button
                  onClick={handleContact}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <FiMessageCircle className="mr-2" />
                  Message {item.type === 'lost' ? 'Owner' : 'Finder'}
                </button>
              )}

              {!isAuthenticated && (
                <Link to="/login" className="btn-primary w-full text-center block">
                  Login to Contact
                </Link>
              )}
            </div>

            {/* Potential Matches */}
            {matches.length > 0 && (
              <div className="card mt-6">
                <h2 className="text-xl font-semibold mb-4">
                  Potential Matches ({matches.length})
                </h2>
                <div className="space-y-3">
                  {matches.slice(0, 3).map(match => (
                    <Link
                      key={match.id}
                      to={`/items/${match.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      {match.images && match.images[0] ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${match.images[0]}`}
                          alt={match.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <FiTag className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{match.name}</h3>
                        <p className="text-sm text-gray-500">{match.location}</p>
                        <span className="text-xs badge badge-info">
                          Match Score: {match.matchScore}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">✅</span>
                {item?.type === 'lost' ? 'ยืนยันว่าเจอของแล้ว' : 'ยืนยันการคืนเจ้าของ'}
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <FiCheck className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                    {item?.type === 'lost' 
                      ? 'คุณเจอของแล้วใช่ไหม?' 
                      : 'คุณคืนเจ้าของเรียบร้อยแล้วใช่ไหม?'}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    รายการนี้จะถูกลบออกจากระบบ และผู้อื่นจะไม่สามารถดูได้อีกต่อไป
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">รายการ:</span> {item?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">ประเภท:</span>{' '}
                  <span className={item?.type === 'lost' ? 'text-red-600' : 'text-green-600'}>
                    {item?.type === 'lost' ? 'ของหาย' : 'ของเจอ'}
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>💡</span>
                <p>
                  <strong>หมายเหตุ:</strong> การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                {item?.type === 'lost' ? 'ยืนยัน เจอของแล้ว' : 'ยืนยัน คืนเจ้าของแล้ว'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;


