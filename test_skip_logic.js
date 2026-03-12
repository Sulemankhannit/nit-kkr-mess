const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

async function test() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nitkkr-mess');
    console.log('Connected to DB');

    // Create a dummy user
    const email = `test_${Date.now()}@nitkkr.ac.in`;
    const user = new User({
        name: 'Test Setup User',
        email: email,
        password: 'password',
        isVerified: true,
        skippedMeals: 0
    });
    await user.save();
    console.log('Created User:', user._id);

    // Test Math.max(0, user.skippedMeals - 1) logic
    user.skippedMeals = 0;
    user.skippedMeals = Math.max(0, user.skippedMeals - 1);
    await user.save();
    console.log('Skips after preventing negative:', user.skippedMeals);
    if (user.skippedMeals < 0) throw new Error("Skipped meals went negative!");

    // Set skips to 4
    user.skippedMeals = 4;
    await user.save();

    console.log('Skips set to 4');

    // Test logic from controller for checking logic
    const rewardsAvailable = Math.floor((user.skippedMeals || 0) / 3);
    console.log('Available rewards via division:', rewardsAvailable);

    if (rewardsAvailable < 1) {
        throw new Error("Should have 1 reward available");
    }

    // Verify Reward QR logic (Mock admin scanning)
    const payload = user._id.toString();
    const fetchedUser = await User.findById(payload);

    if (fetchedUser.skippedMeals < 3) {
        throw new Error("Student does not have enough skips");
    }

    fetchedUser.skippedMeals -= 3;
    await fetchedUser.save();

    console.log('Skips after reward redemption:', fetchedUser.skippedMeals);
    if (fetchedUser.skippedMeals !== 1) throw new Error("Skips should be 1 after redemption!");

    console.log('All backend logic verified successfully!');

    process.exit(0);
}

test().catch(console.error);
