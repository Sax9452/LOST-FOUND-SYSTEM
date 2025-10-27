const matchingAlgorithm = require('../../backend/utils/matchingAlgorithm');
const { pool } = require('../../backend/config/database');

describe('Matching Algorithm', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('findMatches', () => {
    it('should find matching items of opposite type', async () => {
      // This is a placeholder test
      // You'll need to create test data in the database first
      
      const testItem = {
        id: 1,
        type: 'lost',
        name: 'iPhone 13',
        description: 'Black iPhone 13 Pro',
        category: 'electronics',
        date: '2024-01-15',
        location: 'Library'
      };

      const matches = await matchingAlgorithm.findMatches(testItem);

      expect(Array.isArray(matches)).toBe(true);
      // Add more assertions based on your test data
    });

    it('should not match items of the same type', async () => {
      const testItem = {
        id: 1,
        type: 'lost',
        name: 'Test Item',
        description: 'Description',
        category: 'other',
        date: '2024-01-15',
        location: 'Test Location'
      };

      const matches = await matchingAlgorithm.findMatches(testItem);
      
      // All matches should be 'found' type
      const hasLostType = matches.some(match => match.type === 'lost');
      expect(hasLostType).toBe(false);
    });
  });

  describe('Text Similarity', () => {
    it('should calculate similarity correctly', () => {
      // You can extract the calculateTextSimilarity function
      // and test it separately
      // This is a placeholder
    });
  });
});

