require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        // Demote existing admins to avoid conflicts
        await User.updateMany({ role: 'admin' }, { $set: { role: 'student' } });

        // Hash the admin password properly for bcrypt.compare during login
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        let admin = await User.findOne({ email: 'admin@nitkkr.ac.in' });
        if (!admin) {
            admin = new User({ 
                name: 'System Admin', 
                email: 'admin@nitkkr.ac.in', 
                password: hashedPassword, 
                role: 'admin', 
                isVerified: true, 
                isProfileComplete: true, 
                rollNumber: 'ADMINOOOO' 
            });
            await admin.save();
            console.log('Created admin@nitkkr.ac.in with hashed password admin123');
        } else {
            admin.password = hashedPassword;
            admin.role = 'admin';
            admin.isVerified = true;
            await admin.save();
            console.log('Reset admin@nitkkr.ac.in with hashed password admin123');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
});
