/**
 * Translation Utility
 * ใช้ MyMemory Translation API (ฟรี) หรือ Google Translate API
 */

const axios = require('axios');

/**
 * แปลข้อความด้วย MyMemory Translation API (ฟรี)
 * @param {string} text - ข้อความที่ต้องการแปล
 * @param {string} from - ภาษาต้นทาง (th, en)
 * @param {string} to - ภาษาปลายทาง (th, en)
 * @returns {Promise<string>} ข้อความที่แปลแล้ว
 */
async function translateWithMyMemory(text, from = 'th', to = 'en') {
  try {
    if (!text || text.trim() === '') return text;
    
    // ถ้าเป็นภาษาเดียวกัน ไม่ต้องแปล
    if (from === to) return text;

    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: `${from}|${to}`
      },
      timeout: 5000
    });

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }
    
    return text; // ถ้าแปลไม่ได้ ให้คืนค่าต้นฉบับ
  } catch (error) {
    console.error('Translation error (MyMemory):', error.message);
    return text; // ถ้าเกิด error ให้คืนค่าต้นฉบับ
  }
}

/**
 * แปลข้อความด้วย Google Translate API (ต้องมี API key)
 * @param {string} text - ข้อความที่ต้องการแปล
 * @param {string} from - ภาษาต้นทาง
 * @param {string} to - ภาษาปลายทาง
 * @returns {Promise<string>} ข้อความที่แปลแล้ว
 */
async function translateWithGoogle(text, from = 'th', to = 'en') {
  try {
    if (!text || text.trim() === '') return text;
    if (from === to) return text;

    // ต้องมี GOOGLE_TRANSLATE_API_KEY ใน .env
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      console.warn('Google Translate API key not found, using MyMemory instead');
      return translateWithMyMemory(text, from, to);
    }

    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        q: text,
        source: from,
        target: to,
        format: 'text'
      },
      {
        timeout: 5000
      }
    );

    if (response.data && response.data.data && response.data.data.translations) {
      return response.data.data.translations[0].translatedText;
    }
    
    return text;
  } catch (error) {
    console.error('Translation error (Google):', error.message);
    // Fallback to MyMemory
    return translateWithMyMemory(text, from, to);
  }
}

/**
 * แปลข้อความ (ใช้ MyMemory เป็น default, fallback to Google ถ้ามี key)
 * @param {string} text - ข้อความที่ต้องการแปล
 * @param {string} from - ภาษาต้นทาง
 * @param {string} to - ภาษาปลายทาง
 * @returns {Promise<string>} ข้อความที่แปลแล้ว
 */
async function translate(text, from = 'th', to = 'en') {
  // ใช้ Google ถ้ามี API key, ไม่งั้นใช้ MyMemory
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    return translateWithGoogle(text, from, to);
  }
  return translateWithMyMemory(text, from, to);
}

/**
 * แปลหลายข้อความพร้อมกัน
 * @param {Array<string>} texts - ข้อความที่ต้องการแปล
 * @param {string} from - ภาษาต้นทาง
 * @param {string} to - ภาษาปลายทาง
 * @returns {Promise<Array<string>>} ข้อความที่แปลแล้ว
 */
async function translateBatch(texts, from = 'th', to = 'en') {
  try {
    // แปลทีละข้อความ (MyMemory มี rate limit)
    const translated = await Promise.all(
      texts.map(text => translate(text, from, to))
    );
    return translated;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // คืนค่าต้นฉบับถ้าเกิด error
  }
}

module.exports = {
  translate,
  translateBatch,
  translateWithMyMemory,
  translateWithGoogle
};




