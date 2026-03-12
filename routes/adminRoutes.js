const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Cook-Sheet (Real-time headcount)
router.get('/cook-sheet', protect, adminOnly, adminController.getCookSheet);

// Analytics & AI Predictor data
router.get('/analytics', protect, adminOnly, adminController.getAnalytics);
// Attendance and Rewards
router.post('/attendance/mark', protect, adminOnly, adminController.markAttendance);
router.post('/reward/verify', protect, adminOnly, adminController.verifyRewardQR);
// Student Management
router.get('/student/search', protect, adminOnly, adminController.searchStudent);
router.delete('/student/:id', protect, adminOnly, adminController.deleteStudent);

// Feedback retrieval
router.get('/feedback/all', protect, adminOnly, adminController.getAllFeedback);

module.exports = router;
