import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import translateService from '../api/translateService';

/**
 * Custom hook สำหรับแปลข้อความ name, description, location
 * @param {Object} item - item object ที่มี name, description, location
 * @returns {Object} { translatedName, translatedDescription, translatedLocation, loading }
 */
export const useTranslateItem = (item) => {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState({
    name: item?.name || '',
    description: item?.description || '',
    location: item?.location || ''
  });
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState({});

  const currentLang = i18n.language || 'th';
  const isEnglish = currentLang === 'en';

  useEffect(() => {
    if (!item) return;

    // ถ้าเป็นภาษาไทย ไม่ต้องแปล
    if (!isEnglish) {
      setTranslated({
        name: item.name || '',
        description: item.description || '',
        location: item.location || ''
      });
      return;
    }

    // ตรวจสอบ cache
    const cacheKey = `${item.id}_${currentLang}`;
    if (cache[cacheKey]) {
      setTranslated(cache[cacheKey]);
      return;
    }

    // แปลข้อความ
    const translateItem = async () => {
      setLoading(true);
      try {
        const result = await translateService.translateItem(
          {
            name: item.name,
            description: item.description,
            location: item.location
          },
          'th',
          'en'
        );

        if (result.success) {
          const translatedData = {
            name: result.translated.name || item.name,
            description: result.translated.description || item.description,
            location: result.translated.location || item.location
          };
          setTranslated(translatedData);
          // เก็บใน cache
          setCache(prev => ({
            ...prev,
            [cacheKey]: translatedData
          }));
        }
      } catch (error) {
        console.error('Translation error:', error);
        // ถ้าแปลไม่ได้ ให้ใช้ข้อความต้นฉบับ
        setTranslated({
          name: item.name || '',
          description: item.description || '',
          location: item.location || ''
        });
      } finally {
        setLoading(false);
      }
    };

    translateItem();
  }, [item, isEnglish, currentLang, cache]);

  return {
    translatedName: translated.name,
    translatedDescription: translated.description,
    translatedLocation: translated.location,
    loading
  };
};

/**
 * Hook สำหรับแปลข้อความเดียว
 * @param {string} text - ข้อความที่ต้องการแปล
 * @returns {string} ข้อความที่แปลแล้ว
 */
export const useTranslateText = (text) => {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState(text || '');
  const [cache, setCache] = useState({});

  const currentLang = i18n.language || 'th';
  const isEnglish = currentLang === 'en';

  useEffect(() => {
    if (!text || !isEnglish) {
      setTranslated(text || '');
      return;
    }

    // ตรวจสอบ cache
    if (cache[text]) {
      setTranslated(cache[text]);
      return;
    }

    // แปลข้อความ
    const translateText = async () => {
      try {
        const result = await translateService.translate(text, 'th', 'en');
        if (result.success) {
          setTranslated(result.translated);
          setCache(prev => ({ ...prev, [text]: result.translated }));
        } else {
          setTranslated(text);
        }
      } catch (error) {
        console.error('Translation error:', error);
        setTranslated(text);
      }
    };

    translateText();
  }, [text, isEnglish, cache]);

  return translated;
};

