const express = require('express');
const router = express.Router();
const { toggleRsvp } = require('../controllers/rsvpController');
const { protect } = require('../middleware/authMiddleware');

// Student interacts with this to RSVP
router.post('/:mealId', protect, toggleRsvp);

module.exports = router;
