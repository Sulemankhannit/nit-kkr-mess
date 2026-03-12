const express = require('express');
const router = express.Router();
const { createWeeklyMeals } = require('../controllers/menuController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Only logged in Admins can post to this route
router.post('/upload-week', protect, adminOnly, createWeeklyMeals);

// Logged in users (students) can get today's meals
router.get('/today', protect, require('../controllers/menuController').getTodayMeals);

module.exports = router;