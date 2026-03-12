require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    let admin = await User.findOne({ email: 'superadmin@nitkkr.ac.in' });
    if (!admin) {
        admin = new User({ 
            name: 'Super Admin', 
            email: 'superadmin@nitkkr.ac.in', 
            password: 'password123', 
            role: 'admin', 
            isVerified: true, 
            isProfileComplete: true, 
            rollNumber: '000000000' 
        });
        await admin.save();
        console.log('Created superadmin@nitkkr.ac.in with password123');
    } else {
        admin.password = 'password123';
        admin.role = 'admin';
        await admin.save();
        console.log('Reset superadmin@nitkkr.ac.in with password123');
    }
    process.exit(0);
});
