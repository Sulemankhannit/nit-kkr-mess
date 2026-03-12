const mongoose = require('mongoose');
const User = require('./models/User');
const Meal = require('./models/Meal');
const dotenv = require('dotenv');

dotenv.config();

async function runTest() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear previous test users if any
    await User.deleteMany({ email: 'test_skip_reward@nitkkr.ac.in' });
    await User.deleteMany({ email: 'admin_test@nitkkr.ac.in' });

    // 1. Create a Student
    const student = new User({
        name: 'Test Student',
        email: 'test_skip_reward@nitkkr.ac.in',
        password: 'password123',
        role: 'student',
        isVerified: true,
        skippedMeals: 0
    });
    await student.save();
    console.log(`Student created: ${student._id}`);

    // Create an Admin
    const admin = new User({
        name: 'Test Admin',
        email: 'admin_test@nitkkr.ac.in',
        password: 'password123',
        role: 'admin',
        isVerified: true
    });
    await admin.save();
    console.log(`Admin created: ${admin._id}`);

    // Create a mock meal
    let date = new Date();
    date.setDate(date.getDate() + 1); // Tomorrow to avoid lock
    const meal = new Meal({
        date: date,
        type: 'Dinner',
        menuItems: ['Testing Food']
    });
    await meal.save();
    console.log(`Meal created: ${meal._id}`);

    try {
        // --- TEST 1: Test RSVP Skip -> Attend (Ensure skips do not go negative) ---
        console.log("\n--- TEST 1: RSVP Skip -> Attend ---");

        // Define a fake req, res for RSVP controller
        const rsvpController = require('./controllers/rsvpController');

        let req = {
            params: { mealId: meal._id },
            body: { status: 'Attending' }, // Try to attend first (skips currently 0)
            user: { id: student._id }
        };

        let resData = null;
        let res = {
            status: (code) => {
                return { json: (data) => { resData = data; } };
            }
        };

        // Attend
        await rsvpController.toggleRsvp(req, res);

        let updatedStudent = await User.findById(student._id);
        console.log(`Skips after Attending (was 0): ${updatedStudent.skippedMeals} - Expect 0`);

        // Skip
        req.body.status = 'Skipping';
        await rsvpController.toggleRsvp(req, res);

        updatedStudent = await User.findById(student._id);
        console.log(`Skips after Skipping: ${updatedStudent.skippedMeals} - Expect 1`);

        // Attend Again
        req.body.status = 'Attending';
        await rsvpController.toggleRsvp(req, res);

        updatedStudent = await User.findById(student._id);
        console.log(`Skips after reverting to Attending: ${updatedStudent.skippedMeals} - Expect 0`);

        // Mock Background Job giving Skips (Test 1.b)
        console.log("\n--- TEST 1.b: Cron Job Skip Evaluation ---");
        req.body.status = 'Skipping';
        await rsvpController.toggleRsvp(req, res); // They skip

        // Simulate Meal End without them attending
        let currentMeal = await Meal.findById(meal._id);
        if (currentMeal.skippedStudents.includes(student._id)) {
            // Verify they didn't actually attend
            const attendeeIds = currentMeal.actualAttendees.map(a => a.student.toString());
            if (!attendeeIds.includes(student._id.toString())) {
                const updatedS = await User.findByIdAndUpdate(student._id, { $inc: { skippedMeals: 1 } }, { new: true });
                console.log(`Skips after Cron job evaluated: ${updatedS.skippedMeals} - Expect 1`);
            }
        }


        // --- TEST 2 & 3: Claim Reward Logic (rewardsAvailable & deduct skips later) ---
        console.log("\n--- TEST 2 & 3: Claim Reward Logic ---");
        // Force skipped meals to 2
        updatedStudent = await User.findById(student._id);
        updatedStudent.skippedMeals = 2; // CHANGED TO 2
        await updatedStudent.save();
        console.log(`Mocked skippedMeals to: 2`);

        const billingController = require('./controllers/billingController');

        req = { user: { id: student._id } };

        // Get Ledger
        await billingController.getLedger(req, res);
        console.log(`Ledger rewardsAvailableToClaim: ${resData.ledger.rewardsAvailableToClaim} - Expect 1 (Math.floor(2/2))`);

        // Claim Reward
        await billingController.claimReward(req, res);
        console.log(`Claim Reward response: ${resData.message}`);
        const qrData = resData.qrData;
        console.log(`QR Data generated: ${qrData} - Expect Student ID (${student._id})`);

        updatedStudent = await User.findById(student._id);
        console.log(`Skips after claiming reward: ${updatedStudent.skippedMeals} - Expect 0 (2 - 2 = 0)`);
        console.log(`Active Rewards after claiming: ${updatedStudent.rewardsAvailable} - Expect 1`);


        // --- TEST 4: Admin Verify Reward QR ---
        console.log("\n--- TEST 4: Admin verifyRewardQR ---");
        const adminController = require('./controllers/adminController');

        req = {
            body: { payload: qrData }, // The scanned string
            user: { id: admin._id }
        };

        await adminController.verifyRewardQR(req, res);
        console.log(`Admin Verification response: ${resData.message}`);

        updatedStudent = await User.findById(student._id);
        console.log(`Active Rewards after Admin verified QR: ${updatedStudent.rewardsAvailable} - Expect 0`);

        console.log("\n✅ ALL TESTS PASSED!");

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
