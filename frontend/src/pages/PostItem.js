import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PostItem = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category || !formData.location) {
      toast.error(t('items.post.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('date', formData.date.toISOString().split('T')[0]);
      formDataToSend.append('location', formData.location);
      if (formData.latitude) formDataToSend.append('latitude', formData.latitude);
      if (formData.longitude) formDataToSend.append('longitude', formData.longitude);
      
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const response = await itemService.createItem(formDataToSend);
      
      if (response.data.matchesFound > 0) {
        toast.success(t('items.post.matchesFound', { count: response.data.matchesFound }));
      } else {
        toast.success(t('items.post.success'));
      }
      navigate(`/items/${response.data.item.id}`);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('items.post.title')}</h1>

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
                <select
                        name="type"
                  value={formData.type}
                        onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="lost">{t('items.post.lostOption')}</option>
                  <option value="found">{t('items.post.foundOption')}</option>
                </select>
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
                  {loading ? t('items.post.posting') : t('items.post.submitButton')}
                  </button>
                </div>
              </div>
            )}
          </form>
      </div>
    </div>
  );
};

export default PostItem;
