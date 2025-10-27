const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect, admin);

// Dashboard stats
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Item management
router.get('/items/pending', adminController.getPendingItems);
router.put('/items/:id/approve', adminController.approveItem);
router.put('/items/:id/reject', adminController.rejectItem);
router.delete('/items/:id', adminController.deleteItem);

// Chat management
router.get('/chats/reported', adminController.getReportedChats);
router.put('/chats/:id/resolve', adminController.resolveReportedChat);

module.exports = router;


