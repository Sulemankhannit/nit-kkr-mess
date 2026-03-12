const express = require('express');
const router = express.Router();
const { createPoll, getActivePolls, getAdminPolls, deletePoll, votePoll, submitFeedback, getLiveCrowd, getStudentAnalytics } = require('../controllers/engagementController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Student Routes
router.get('/poll/active', protect, getActivePolls);
router.post('/poll/:pollId/vote', protect, votePoll);
router.post('/feedback/:mealId', protect, submitFeedback);
router.get('/student-analytics', protect, getStudentAnalytics); // New route for student analytics

// Admin Routes
router.post('/poll/create', protect, adminOnly, createPoll);
router.get('/poll/admin/all', protect, adminOnly, getAdminPolls);
router.delete('/poll/:pollId', protect, adminOnly, deletePoll);

// Global / Student Engagement Routes
router.get('/crowd', getLiveCrowd); // You might want this open or protected

module.exports = router;
