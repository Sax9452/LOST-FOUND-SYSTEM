import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiBell } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    location: user?.location || '',
    language: user?.language || 'en'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: user?.notificationPreferences?.email ?? true,
    push: user?.notificationPreferences?.push ?? true,
    matchAlerts: user?.notificationPreferences?.matchAlerts ?? true
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.updateProfile(profileData);
      updateUser(response.data.user);
      toast.success(t('profile.updateSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('profile.passwordNotMatch'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t('profile.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success(t('profile.updatePasswordSuccess'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || t('profile.updatePasswordError'));
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.updateNotificationPreferences(notificationPrefs);
      toast.success(t('profile.updatePreferencesSuccess'));
    } catch (error) {
      toast.error(t('profile.updatePreferencesError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('profile.profileSettings')}</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            {t('profile.title')}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'password'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            {t('profile.password')}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'notifications'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            {t('profile.notifications')}
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">{t('profile.profileInformation')}</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.username')}</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="input-field pl-10"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.email')}</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email}
                    className="input-field pl-10 bg-gray-100 dark:bg-gray-700"
                    disabled
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('profile.emailCannotBeChanged')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.phone')}</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="input-field pl-10"
                    placeholder={t('profile.optional')}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.location')}</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="input-field pl-10"
                    placeholder={t('profile.cityCountry')}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.language')}</label>
                <select
                  value={profileData.language}
                  onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                  className="input-field"
                >
                  <option value="en">{t('profile.english')}</option>
                  <option value="th">{t('profile.thai')}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? <div className="spinner"></div> : t('profile.saveChanges')}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">{t('profile.changePassword')}</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.currentPassword')}</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input-field pl-10"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.newPassword')}</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-field pl-10"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('profile.confirmNewPassword')}</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-field pl-10"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? <div className="spinner"></div> : t('profile.changePassword')}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">{t('profile.notificationPreferences')}</h2>
            <form onSubmit={handleNotificationUpdate} className="space-y-6">
              <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FiBell className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">{t('profile.emailNotifications')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('profile.receiveEmailNotifications')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.email}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FiBell className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">{t('profile.pushNotifications')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('profile.receivePushNotifications')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.push}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FiBell className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">{t('profile.matchAlerts')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('profile.getNotifiedWhenMatchesFound')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.matchAlerts}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, matchAlerts: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? <div className="spinner"></div> : t('profile.savePreferences')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
