import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { itemService } from '../api/services';
import toast from 'react-hot-toast';
import { FiUpload, FiX } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PostItem = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const CATEGORIES = [
    { value: 'electronics', label: t('items.category.electronics') },
    { value: 'documents', label: t('items.category.documents') },
    { value: 'accessories', label: t('items.category.accessories') },
    { value: 'bags', label: t('items.category.bags') },
    { value: 'clothing', label: t('items.category.clothing') },
    { value: 'keys', label: t('items.category.keys') },
    { value: 'wallet', label: t('items.category.wallet') },
    { value: 'other', label: t('items.category.other') }
  ];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost',
    name: '',
    description: '',
    category: '',
    date: new Date(),
    location: ''
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

      setImages(prev => [...prev, file]);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      // แปลง date เป็น YYYY-MM-DD format
      data.append('date', formData.date.toISOString().split('T')[0]);
      data.append('location', formData.location);
      
      images.forEach(image => {
        data.append('images', image);
      });

      const response = await itemService.createItem(data);
      
      toast.success(t('items.post.success'));
      if (response.data.matchesFound > 0) {
        toast.success(t('items.post.matchesFound', { count: response.data.matchesFound }));
      }
      
      navigate('/my-items');
    } catch (error) {
      toast.error(error.response?.data?.message || t('items.post.error'));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.type || !formData.name || !formData.category)) {
      toast.error(t('items.post.fillRequired'));
      return;
    }
    if (step === 2 && !formData.description) {
      toast.error(t('items.post.provideDescription'));
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t('items.post.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t('items.post.subtitle')}
        </p>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map(num => (
            <React.Fragment key={num}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= num ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {num}
              </div>
              {num < 4 && (
                <div className={`flex-1 h-1 mx-2 ${step > num ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">{t('items.post.step1Title')}</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t('items.post.itemType')} *</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition hover:border-primary-600">
                      <input
                        type="radio"
                        name="type"
                        value="lost"
                        checked={formData.type === 'lost'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="font-medium">{t('items.type.lost')}</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition hover:border-primary-600">
                      <input
                        type="radio"
                        name="type"
                        value="found"
                        checked={formData.type === 'found'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="font-medium">{t('items.type.found')}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('items.details.itemName')} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={t('items.post.itemNamePlaceholder')}
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('items.details.category')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input-field appearance-none pr-10 cursor-pointer hover:border-primary-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 transition-all"
                      required
                    >
                      <option value="" disabled className="text-gray-400">
                        {t('items.post.selectCategory')}
                      </option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value} className="text-gray-900 dark:text-gray-100">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom Arrow Icon */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {!formData.category && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      💡 {t('items.post.categoryHint')}
                    </p>
                  )}
                </div>

                <button type="button" onClick={nextStep} className="btn-primary w-full">
                  {t('items.post.next')}
                </button>
              </div>
            )}

            {/* Step 2: Description */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">{t('items.post.step2Title')}</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t('items.post.detailedDescription')} *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-field h-32"
                    placeholder={t('items.post.descriptionPlaceholder')}
                    autoComplete="off"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.description.length}/2000 {t('items.post.characters')}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                    {t('items.post.back')}
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary flex-1">
                    {t('items.post.next')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Location & Date */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">{t('items.post.step3Title')}</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.type === 'lost' ? t('items.post.whereLost') : t('items.post.whereFound')} *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={t('items.post.locationPlaceholder')}
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.type === 'lost' ? t('items.post.whenLost') : t('items.post.whenFound')} *
                  </label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    className="input-field w-full"
                    dateFormat="MMMM d, yyyy"
                    maxDate={new Date()}
                  />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                    {t('items.post.back')}
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary flex-1">
                    {t('items.post.next')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">{t('items.post.step4Title')}</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('items.post.uploadImages')}
                  </label>
                  
                  {previews.length < 5 && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-600 transition">
                      <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">{t('items.post.clickUpload')}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
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
                    {t('items.post.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    {loading ? <div className="spinner"></div> : t('items.post.submitButton')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostItem;


