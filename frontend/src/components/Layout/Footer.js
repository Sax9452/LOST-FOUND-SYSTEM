import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiGithub, FiTwitter, FiFacebook, FiMail } from 'react-icons/fi';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                  {t('footer.searchItems')}
                </Link>
              </li>
              <li>
                <Link to="/post" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">
                  {t('footer.postItem')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={(e) => e.preventDefault()} 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm text-left"
                >
                  {t('footer.helpCenter')}
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => e.preventDefault()} 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm text-left"
                >
                  {t('footer.termsOfService')}
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => e.preventDefault()} 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm text-left"
                >
                  {t('footer.privacyPolicy')}
                </button>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.connect')}</h3>
            <div className="flex space-x-4">
              <button 
                onClick={(e) => e.preventDefault()} 
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => e.preventDefault()} 
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Twitter"
              >
                <FiTwitter className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => e.preventDefault()} 
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Github"
              >
                <FiGithub className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => e.preventDefault()} 
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Email"
              >
                <FiMail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


