const { translate, translateBatch } = require('../utils/translate');

/**
 * @desc    แปลข้อความเดียว
 * @route   POST /api/translate
 */
exports.translateText = async (req, res, next) => {
  try {
    const { text, from = 'th', to = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุข้อความที่ต้องการแปล'
      });
    }

    const translatedText = await translate(text, from, to);

    res.json({
      success: true,
      original: text,
      translated: translatedText,
      from,
      to
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    แปลหลายข้อความพร้อมกัน
 * @route   POST /api/translate/batch
 */
exports.translateBatch = async (req, res, next) => {
  try {
    const { texts, from = 'th', to = 'en' } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ array ของข้อความที่ต้องการแปล'
      });
    }

    const translated = await translateBatch(texts, from, to);

    res.json({
      success: true,
      original: texts,
      translated,
      from,
      to
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    แปลข้อมูล item (name, description, location)
 * @route   POST /api/translate/item
 */
exports.translateItem = async (req, res, next) => {
  try {
    const { name, description, location, from = 'th', to = 'en' } = req.body;

    const texts = [];
    if (name) texts.push(name);
    if (description) texts.push(description);
    if (location) texts.push(location);

    if (texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุข้อมูลที่ต้องการแปล (name, description, location)'
      });
    }

    const translated = await translateBatch(texts, from, to);

    const result = {};
    let index = 0;
    if (name) {
      result.name = translated[index++];
    }
    if (description) {
      result.description = translated[index++];
    }
    if (location) {
      result.location = translated[index++];
    }

    res.json({
      success: true,
      original: { name, description, location },
      translated: result,
      from,
      to
    });
  } catch (error) {
    next(error);
  }
};




