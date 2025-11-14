import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const EditItem = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const CATEGORIES = [
    { value: 'electronics', label: t('items.post.electronicsLabel') },
    { value: 'documents', label: t('items.post.documentsLabel') },
    { value: 'accessories', label: t('items.post.accessoriesLabel') },
    { value: 'bags', label: t('items.post.bagsLabel') },
    { value: 'clothing', label: t('items.post.clothingLabel') },
    { value: 'keys', label: t('items.post.keysLabel') },
    { value: 'wallet', label: t('items.post.walletLabel') },
    { value: 'other', label: t('items.post.otherLabel') }
  ];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(true);
  const [formData, setFormData] = useState({
    type: 'lost',
    name: '',
    description: '',
    category: '',
    date: new Date(),
    location: '',
    latitude: '',
    longitude: ''
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
  };

  const fetchItem = async () => {
    try {
      setLoadingItem(true);
      const response = await itemService.getItemById(id);
      const item = response.data.item;
      
      // Check if user is owner
      if (user?.id !== item.owner_id) {
        toast.error(t('items.details.failedToDeleteItem'));
        navigate(`/items/${id}`);
        return;
      }

      // Set form data
      setFormData({
        type: item.type,
        name: item.name,
        description: item.description || '',
        category: item.category,
        date: new Date(item.date),
        location: item.location || '',
        latitude: item.latitude || '',
        longitude: item.longitude || ''
      });

      // Set existing images
      if (item.images && item.images.length > 0) {
        const imageUrls = item.images.map(img => getImageUrl(img));
        setExistingImages(imageUrls);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error(t('items.details.itemNotFound'));
      navigate('/my-items');
    } finally {
      setLoadingItem(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length + existingImages.length > 5) {
      toast.error(t('items.post.maxImages'));
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ${t('items.post.imageTooLarge')}`);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
      setImages(prev => [...prev, file]);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category || !formData.location) {
      toast.error(t('items.post.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('date', formData.date.toISOString().split('T')[0]);
      formDataToSend.append('location', formData.location);
      if (formData.latitude) formDataToSend.append('latitude', formData.latitude);
      if (formData.longitude) formDataToSend.append('longitude', formData.longitude);
      
      // Send existing images that should be kept
      existingImages.forEach(imageUrl => {
        formDataToSend.append('existingImages', imageUrl);
      });
      
      // Add new images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      await itemService.updateItem(id, formDataToSend);
      
      toast.success(t('items.details.itemUpdatedSuccessfully'));
      navigate(`/items/${id}`);
    } catch (error) {
      const message = error.response?.data?.message || t('items.post.error');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.category)) {
      toast.error(t('items.post.fillRequired'));
      return;
    }
    if (step === 2 && !formData.description) {
      toast.error(t('items.post.provideDescription'));
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  if (loadingItem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('items.details.editItem')}</h1>
          <button
            onClick={() => navigate(`/items/${id}`)}
            className="btn-secondary"
          >
            <FiArrowLeft className="inline mr-2" />
            {t('items.details.backToSearch')}
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">{t('items.post.step1Title')}</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('items.post.itemType')}</label>
                <input
                  type="text"
                  value={t(`items.type.${formData.type}`)}
                  className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">{t('items.details.typeCannotBeChanged')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('items.post.itemNameLabel')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder={t('items.post.itemNamePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('items.post.categoryLabel')}</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">{t('items.post.selectCategory')}</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <button type="button" onClick={nextStep} className="btn-primary w-full">
                {t('items.post.next')} <FiArrowRight className="inline ml-2" />
              </button>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">{t('items.post.step2Title')}</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('items.post.detailedDescription')}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  rows="6"
                  placeholder={t('items.post.descriptionPlaceholder')}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length} / 2000 {t('items.post.characters')}
                </p>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                  <FiArrowLeft className="inline mr-2" /> {t('items.post.back')}
                </button>
                <button type="button" onClick={nextStep} className="btn-primary flex-1">
                  {t('items.post.next')} <FiArrowRight className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Location & Date */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">{t('items.post.step3Title')}</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {formData.type === 'lost' ? t('items.post.whenLost') : t('items.post.whenFound')}
                </label>
                <DatePicker
                  selected={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  className="input-field w-full"
                  maxDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {formData.type === 'lost' ? t('items.post.whereLost') : t('items.post.whereFound')}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field"
                  placeholder={t('items.post.locationPlaceholder')}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                  <FiArrowLeft className="inline mr-2" /> {t('items.post.back')}
                </button>
                <button type="button" onClick={nextStep} className="btn-primary flex-1">
                  {t('items.post.next')} <FiArrowRight className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Images & Submit */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">{t('items.post.step4Title')}</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('items.post.uploadImages')}</label>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Existing Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img src={imageUrl} alt={`Existing ${index}`} className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                    <FiUpload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-600 dark:text-gray-400">{t('items.post.clickUpload')}</span>
                  </label>
                </div>

                {/* New Image Previews */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-32 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                  <FiArrowLeft className="inline mr-2" /> {t('items.post.back')}
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? t('items.post.posting') : t('items.details.update') || 'Update Item'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditItem;

