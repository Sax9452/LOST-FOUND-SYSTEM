const { User } = require('../../../backend/models/db');
const { pool } = require('../../../backend/config/database');

describe('User Model', () => {
  beforeAll(async () => {
    // Setup test database if needed
  });

  afterAll(async () => {
    // Clean up
    await pool.end();
  });

  afterEach(async () => {
    // Clean up after each test
    await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
  });

  describe('User.create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test.user@bu.ac.th',
        password: 'password123',
        username: 'testuser'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should not allow duplicate email', async () => {
      const userData = {
        email: 'duplicate.test@bu.ac.th',
        password: 'password123',
        username: 'duplicate'
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User.findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'find.test@bu.ac.th',
        password: 'password123',
        username: 'findtest'
      };

      await User.create(userData);
      const found = await User.findByEmail(userData.email);

      expect(found).toBeDefined();
      expect(found.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const found = await User.findByEmail('nonexistent@bu.ac.th');
      expect(found).toBeNull();
    });
  });

  describe('User.comparePassword', () => {
    it('should return true for correct password', async () => {
      const userData = {
        email: 'password.test@bu.ac.th',
        password: 'correctpassword',
        username: 'pwtest'
      };

      const user = await User.create(userData);
      const isMatch = await User.comparePassword('correctpassword', user.password);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const userData = {
        email: 'password2.test@bu.ac.th',
        password: 'correctpassword',
        username: 'pwtest2'
      };

      const user = await User.create(userData);
      const isMatch = await User.comparePassword('wrongpassword', user.password);

      expect(isMatch).toBe(false);
    });
  });
});

