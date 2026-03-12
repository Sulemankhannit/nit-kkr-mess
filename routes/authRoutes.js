const express = require('express');
const router = express.Router();

// Import the functions from our controller
const { register, verifyOTP, login } = require('../controllers/authController');

// POST request to register & send OTP
// Endpoint: http://localhost:5000/api/auth/register
router.post('/register', register);

// POST request to verify the OTP
// Endpoint: http://localhost:5000/api/auth/verify
router.post('/verify', verifyOTP);

// POST request to log in
// Endpoint: http://localhost:5000/api/auth/login
router.post('/login', login);

// POST request to resend the OTP
// Endpoint: http://localhost:5000/api/auth/resend-otp
router.post('/resend-otp', require('../controllers/authController').resendOTP);

const { protect } = require('../middleware/authMiddleware');

// GET request to fetch logged in user info
router.get('/me', protect, require('../controllers/authController').getMe);

module.exports = router;