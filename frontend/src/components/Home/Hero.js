import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiPlusCircle } from 'react-icons/fi';

const Hero = () => {
    const { t } = useTranslation();

    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 pt-16 pb-32 lg:pt-24 lg:pb-40">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl animate-float"></div>
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-secondary-500/20 blur-3xl animate-float animate-delay-500"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 md:mb-8 animate-fade-in">
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600">
                        {t('home.hero.title')}
                    </span>
                </h1>

                <p className="mt-6 md:mt-8 max-w-2xl mx-auto text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed animate-slide-up animate-delay-100">
                    {t('home.hero.subtitle')}
                </p>

                <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4 md:gap-6 justify-center animate-slide-up animate-delay-200">
                    <Link to="/search" className="btn-primary text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 font-semibold">
                        <FiSearch className="mr-2 h-5 w-5" />
                        {t('nav.search')}
                    </Link>
                    <Link to="/post" className="btn-outline text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 font-semibold">
                        <FiPlusCircle className="mr-2 h-5 w-5" />
                        {t('nav.postItem')}
                    </Link>
                </div>

                {/* Search Bar Preview */}
                <div className="mt-16 md:mt-20 max-w-3xl mx-auto animate-slide-up animate-delay-300">
                    <div className="glass p-3 rounded-2xl md:rounded-3xl flex items-center shadow-2xl border border-white/30 dark:border-gray-700/50">
                        <FiSearch className="ml-4 md:ml-6 text-gray-400 h-5 w-5 md:h-6 md:w-6" />
                        <input
                            type="text"
                            placeholder={t('home.hero.searchPlaceholder') || "Search for lost items..."}
                            className="w-full bg-transparent border-none focus:ring-0 text-base md:text-lg px-4 md:px-6 py-3 md:py-4 text-gray-900 dark:text-white placeholder-gray-500"
                        />
                        <button className="btn-primary rounded-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold">
                            {t('common.search')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
