/**
 * Socket.IO Instance Manager
 * Prevents circular dependency issues
 */

let io = null;

module.exports = {
  /**
   * Initialize Socket.IO instance
   * @param {object} socketIoInstance - Socket.IO server instance
   */
  init: (socketIoInstance) => {
    io = socketIoInstance;
    console.log('✅ Socket.IO instance initialized');
    return io;
  },

  /**
   * Get Socket.IO instance
   * @returns {object} Socket.IO instance
   */
  getIO: () => {
    if (!io) {
      throw new Error('Socket.IO instance not initialized! Call init() first.');
    }
    return io;
  }
};

