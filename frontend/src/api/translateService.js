import axios from './axios';

const translateService = {
  /**
   * แปลข้อความเดียว
   * @param {string} text - ข้อความที่ต้องการแปล
   * @param {string} from - ภาษาต้นทาง (th, en)
   * @param {string} to - ภาษาปลายทาง (th, en)
   */
  translate: async (text, from = 'th', to = 'en') => {
    const response = await axios.post('/api/translate', {
      text,
      from,
      to
    });
    return response.data;
  },

  /**
   * แปลหลายข้อความพร้อมกัน
   * @param {Array<string>} texts - ข้อความที่ต้องการแปล
   * @param {string} from - ภาษาต้นทาง
   * @param {string} to - ภาษาปลายทาง
   */
  translateBatch: async (texts, from = 'th', to = 'en') => {
    const response = await axios.post('/api/translate/batch', {
      texts,
      from,
      to
    });
    return response.data;
  },

  /**
   * แปลข้อมูล item (name, description, location)
   * @param {Object} itemData - { name, description, location }
   * @param {string} from - ภาษาต้นทาง
   * @param {string} to - ภาษาปลายทาง
   */
  translateItem: async (itemData, from = 'th', to = 'en') => {
    const response = await axios.post('/api/translate/item', {
      ...itemData,
      from,
      to
    });
    return response.data;
  }
};

export default translateService;




