import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  FiMenu, FiX, FiSearch, FiPlusCircle, FiBell, 
  FiUser, FiLogOut, FiMoon, FiSun, FiGrid, FiGlobe, FiMessageSquare 
} from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadNotifications, unreadMessages, darkMode, toggleDarkMode } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuFading, setUserMenuFading] = useState(false);
  const [langMenuFading, setLangMenuFading] = useState(false);
  
  const userMenuRef = useRef(null);
  const langMenuRef = useRef(null);
  const userMenuTimeout = useRef(null);
  const langMenuTimeout = useRef(null);
  
  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    handleCloseMenu('lang');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  // Handle menu mouse leave with fade out
  const handleMenuMouseLeave = (menuType) => {
    if (menuType === 'user') {
      setUserMenuFading(true);
      userMenuTimeout.current = setTimeout(() => {
        setUserMenuOpen(false);
        setUserMenuFading(false);
      }, 200); // Fade duration
    } else if (menuType === 'lang') {
      setLangMenuFading(true);
      langMenuTimeout.current = setTimeout(() => {
        setLangMenuOpen(false);
        setLangMenuFading(false);
      }, 200); // Fade duration
    }
  };

  // Handle menu mouse enter (cancel fade out)
  const handleMenuMouseEnter = (menuType) => {
    if (menuType === 'user') {
      if (userMenuTimeout.current) {
        clearTimeout(userMenuTimeout.current);
        setUserMenuFading(false);
      }
    } else if (menuType === 'lang') {
      if (langMenuTimeout.current) {
        clearTimeout(langMenuTimeout.current);
        setLangMenuFading(false);
      }
    }
  };

  // Close menu immediately (for clicks)
  const handleCloseMenu = (menuType) => {
    if (menuType === 'user') {
      setUserMenuOpen(false);
      setUserMenuFading(false);
      if (userMenuTimeout.current) {
        clearTimeout(userMenuTimeout.current);
      }
    } else if (menuType === 'lang') {
      setLangMenuOpen(false);
      setLangMenuFading(false);
      if (langMenuTimeout.current) {
        clearTimeout(langMenuTimeout.current);
      }
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (userMenuTimeout.current) clearTimeout(userMenuTimeout.current);
      if (langMenuTimeout.current) clearTimeout(langMenuTimeout.current);
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              Lost & Found System
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/search" className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FiSearch className="w-5 h-5" />
              <span>{t('nav.search')}</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/post" className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                  <FiPlusCircle className="w-5 h-5" />
                  <span>{t('nav.postItem')}</span>
                </Link>

                    {/* Messages Link */}
                    <Link to="/chat" className="relative flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <FiMessageSquare className="w-5 h-5" />
                      <span>{t('nav.messages')}</span>
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {unreadMessages}
                        </span>
                      )}
                    </Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <FiBell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div 
                  className="relative"
                  onMouseLeave={() => handleMenuMouseLeave('user')}
                  onMouseEnter={() => handleMenuMouseEnter('user')}
                >
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div 
                      ref={userMenuRef}
                      className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
                        userMenuFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                    >
                      <Link
                        to="/dashboard"
                        onClick={() => handleCloseMenu('user')}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FiGrid className="w-4 h-4" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => handleCloseMenu('user')}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FiUser className="w-4 h-4" />
                        <span>{t('nav.profile')}</span>
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => handleCloseMenu('user')}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiGrid className="w-4 h-4" />
                          <span>{t('nav.admin')}</span>
                        </Link>
                      )}
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => {
                              toggleDarkMode();
                              handleCloseMenu('user');
                            }}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                          >
                            {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                            <span>{darkMode ? t('nav.lightMode') : t('nav.darkMode')}</span>
                          </button>
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-red-600"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                  {t('common.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Language Switcher - Always visible */}
          <div 
            className="relative"
            onMouseLeave={() => handleMenuMouseLeave('lang')}
            onMouseEnter={() => handleMenuMouseEnter('lang')}
          >
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <FiGlobe className="w-5 h-5" />
              <span className="text-sm font-medium">{i18n.language === 'th' ? 'TH' : 'EN'}</span>
            </button>
            
            {langMenuOpen && (
              <div 
                ref={langMenuRef}
                className={`absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 z-50 transition-all duration-200 ${
                  langMenuFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <button
                  onClick={() => changeLanguage('th')}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${i18n.language === 'th' ? 'bg-primary-50 dark:bg-primary-900 text-primary-600' : ''}`}
                >
                  🇹🇭 ไทย
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${i18n.language === 'en' ? 'bg-primary-50 dark:bg-primary-900 text-primary-600' : ''}`}
                >
                  🇺🇸 English
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button - Mobile Only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-2">
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiSearch className="w-5 h-5" />
                <span>{t('nav.search')}</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/post"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg"
                  >
                    <FiPlusCircle className="w-5 h-5" />
                    <span>{t('nav.postItem')}</span>
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <FiMessageSquare className="w-5 h-5" />
                      <span>{t('nav.messages')}</span>
                    </div>
                    {unreadMessages > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiGrid className="w-5 h-5" />
                    <span>{t('nav.dashboard')}</span>
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiBell className="w-5 h-5" />
                    <span>{t('nav.notifications')} {unreadNotifications > 0 && `(${unreadNotifications})`}</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiUser className="w-5 h-5" />
                    <span>{t('nav.profile')}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 text-left"
                  >
                    <FiLogOut className="w-5 h-5" />
                    <span>{t('common.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('common.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg"
                  >
                    {t('common.register')}
                  </Link>
                </>
              )}

              <button
                onClick={toggleDarkMode}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                <span>{darkMode ? t('nav.lightMode') : t('nav.darkMode')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


