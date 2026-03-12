const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        // This regex ensures ONLY NIT Kurukshetra emails can register
        match: [/.+@nitkkr\.ac\.in$/, 'Must be a valid NIT KKR email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'contractor'],
        default: 'student'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String, // We store the OTP temporarily
    },
    otpExpires: {
        type: Date,   // We set an expiration time (e.g., 10 minutes)
    },
    // Gamification & Billing specific to students
    skippedMeals: {
        type: Number,
        default: 0
    },
    rewardsAvailable: {
        type: Number,
        default: 0
    },
    guestDues: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt dates
});

module.exports = mongoose.model('User', userSchema);