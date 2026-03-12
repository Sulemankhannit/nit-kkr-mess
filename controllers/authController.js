const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Setup Nodemailer transporter (We will use Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. REGISTER & SEND OTP
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ message: 'User already exists and is verified. Please log in.' });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Set expiration for 10 minutes from now
        const otpExpires = new Date(Date.now() + 10 * 60000);

        if (user && !user.isVerified) {
            // Update existing unverified user with new OTP and details
            user.name = name;
            user.password = hashedPassword;
            user.role = role || 'student';
            user.otp = otp;
            user.otpExpires = otpExpires;
        } else {
            // Create the user in the database (Unverified)
            user = new User({
                name,
                email,
                password: hashedPassword,
                role: role || 'student', // Include role, default to student
                otp,
                otpExpires
            });
        }
        await user.save();

        // Send the OTP via Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'NIT KKR Mess - Verify Your Account',
            text: `Your OTP for the NIT KKR Mess system is: ${otp}. It is valid for 10 minutes.`
        };

        console.log(`[TESTING] OTP generated for ${email}: ${otp}`);

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("[WARNING] Email failed to send. Could be due to Invalid App Credentials in .env, but user is still registered. Use the OTP from the console above to verify:", mailError.message);
        }

        res.status(200).json({
            message: 'Registration successful! Please check your email (or the console) for the OTP.',
            otp: otp // Added for easier testing on the frontend
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. VERIFY OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

        // Check if OTP matches and is not expired
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Success! Verify user and clear the OTP fields
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Account verified successfully! You can now log in.' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 3. LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Block login if they haven't verified their OTP
        if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Create the JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({ token, role: user.role, name: user.name });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 4. RESEND OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

        // Generate a new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000);

        // Update user
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send the new OTP via Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'NIT KKR Mess - Resend OTP Verification',
            text: `Your new OTP for the NIT KKR Mess system is: ${otp}. It is valid for 10 minutes.`
        };

        console.log(`[TESTING] New OTP generated for ${email}: ${otp}`);

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("[WARNING] Email failed to send. Use the OTP from the console above to verify:", mailError.message);
        }

        res.status(200).json({
            message: 'A new OTP has been sent! Please check your email (or the console).',
            otp: otp
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 6. GET ME (PROFILE)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};