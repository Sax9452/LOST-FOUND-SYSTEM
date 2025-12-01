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
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${window.scrollY > 10 ? 'glass shadow-lg border-b border-white/10 dark:border-gray-700/50' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 md:w-12 md:h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <FiSearch className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <span className="font-heading font-bold text-2xl md:text-3xl text-gray-900 dark:text-white tracking-tight">
              Lost<span className="text-primary-600 dark:text-primary-400">Found</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/search" className="btn-ghost px-4 py-2.5">
              <FiSearch className="w-5 h-5 mr-2" />
              <span className="font-medium">{t('nav.search')}</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/post" className="btn-primary px-5 py-2.5">
                  <FiPlusCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{t('nav.postItem')}</span>
                </Link>

                {/* Messages Link */}
                <Link to="/chat" className="btn-ghost relative">
                  <FiMessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="btn-ghost relative">
                  <FiBell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
                </Link>

                {/* User Menu */}
                <div
                  className="relative ml-2"
                  onMouseLeave={() => handleMenuMouseLeave('user')}
                  onMouseEnter={() => handleMenuMouseEnter('user')}
                >
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full border-2 border-transparent hover:border-primary-200 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div
                      ref={userMenuRef}
                      className={`absolute right-0 mt-4 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl py-2 border border-gray-100 dark:border-gray-700 transition-all duration-200 origin-top-right ${userMenuFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                        }`}
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => handleCloseMenu('user')}
                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                      >
                        <FiGrid className="w-5 h-5 text-gray-400" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => handleCloseMenu('user')}
                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                      >
                        <FiUser className="w-5 h-5 text-gray-400" />
                        <span>{t('nav.profile')}</span>
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => handleCloseMenu('user')}
                          className="flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                        >
                          <FiGrid className="w-5 h-5 text-gray-400" />
                          <span>{t('nav.admin')}</span>
                        </Link>
                      )}

                      <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>

                      <button
                        onClick={() => {
                          toggleDarkMode();
                          handleCloseMenu('user');
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 w-full text-left text-gray-700 dark:text-gray-200"
                      >
                        {darkMode ? <FiSun className="w-5 h-5 text-gray-400" /> : <FiMoon className="w-5 h-5 text-gray-400" />}
                        <span>{darkMode ? t('nav.lightMode') : t('nav.darkMode')}</span>
                      </button>

                      <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left text-red-600"
                      >
                        <FiLogOut className="w-5 h-5" />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link to="/login" className="btn-ghost font-medium">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="btn-primary shadow-none">
                  {t('common.register')}
                </Link>
              </div>
            )}

            {/* Language Switcher */}
            <div
              className="relative ml-2"
              onMouseLeave={() => handleMenuMouseLeave('lang')}
              onMouseEnter={() => handleMenuMouseEnter('lang')}
            >
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiGlobe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {langMenuOpen && (
                <div
                  ref={langMenuRef}
                  className={`absolute right-0 mt-4 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700 z-50 transition-all duration-200 origin-top-right ${langMenuFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                >
                  <button
                    onClick={() => changeLanguage('th')}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between ${i18n.language === 'th' ? 'text-primary-600 font-medium bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    <span>🇹🇭 ไทย</span>
                    {i18n.language === 'th' && <div className="w-2 h-2 rounded-full bg-primary-600"></div>}
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between ${i18n.language === 'en' ? 'text-primary-600 font-medium bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    <span>🇺🇸 English</span>
                    {i18n.language === 'en' && <div className="w-2 h-2 rounded-full bg-primary-600"></div>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in bg-white dark:bg-gray-900 absolute left-0 right-0 px-4 shadow-xl rounded-b-2xl">
            <div className="flex flex-col space-y-2">
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FiSearch className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{t('nav.search')}</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/post"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl"
                  >
                    <FiPlusCircle className="w-5 h-5" />
                    <span className="font-medium">{t('nav.postItem')}</span>
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-3">
                      <FiMessageSquare className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">{t('nav.messages')}</span>
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
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <FiGrid className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">{t('nav.dashboard')}</span>
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <FiBell className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">{t('nav.notifications')} {unreadNotifications > 0 && `(${unreadNotifications})`}</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <FiUser className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">{t('nav.profile')}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 w-full text-left"
                  >
                    <FiLogOut className="w-5 h-5" />
                    <span className="font-medium">{t('common.logout')}</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary justify-center"
                  >
                    {t('common.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary justify-center"
                  >
                    {t('common.register')}
                  </Link>
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 my-2 pt-2 flex justify-between px-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => changeLanguage('th')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${i18n.language === 'th' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    TH
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${i18n.language === 'en' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


