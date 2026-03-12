const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Initialize Express app
const app = express();

// Middleware to parse JSON and allow cross-origin requests
app.use(express.json());
app.use(cors());

// --- NEW LINES: Import and use the authentication routes ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
// -----------------------------------------------------------
const menuRoutes = require('./routes/menuRoutes');
app.use('/api/menu', menuRoutes);

const rsvpRoutes = require('./routes/rsvpRoutes');
app.use('/api/rsvp', rsvpRoutes);

const billingRoutes = require('./routes/billingRoutes');
app.use('/api/billing', billingRoutes);

const engagementRoutes = require('./routes/engagementRoutes');
app.use('/api/engagement', engagementRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Serve static files from the React frontend app
const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Fallback route for React Router (only matching GET requests so we don't swallow bad API POSTs)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// --- BACKGROUND JOB: Process Skips after Meal Ends ---
const Meal = require('./models/Meal');
const User = require('./models/User');

setInterval(async () => {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeFloat = currentHour + (currentMinute / 60);

        // Define end times for meals. Buffer 5 mins for processing safe zone.
        // Breakfast ends at 9:00 AM (9.0)
        // Lunch ends at 2:00 PM (14.0)
        // Dinner ends at 9:00 PM (21.0)
        // We only process if the meal's end time has securely passed today.

        const unconfirmedMeals = await Meal.find({ isSkipsProcessed: false }).sort({ date: 1 });

        for (const meal of unconfirmedMeals) {
            let hasEnded = false;
            const mealDate = new Date(meal.date);
            // Check if meal was yesterday or older
            if (mealDate.toDateString() !== now.toDateString() && mealDate < now) {
                hasEnded = true;
            } else if (mealDate.toDateString() === now.toDateString()) {
                // It is today, check strict times
                if (meal.type === 'Breakfast' && timeFloat >= 9.05) hasEnded = true;
                if (meal.type === 'Lunch' && timeFloat >= 14.05) hasEnded = true;
                if (meal.type === 'Dinner' && timeFloat >= 21.05) hasEnded = true;
            }

            if (hasEnded) {
                console.log(`[JOB] Processing Skips for Meal: ${meal._id} (${meal.type})`);

                // Identify true skips: in skippedStudents AND NOT in actualAttendees
                // Convert actualAttendees ObjectIds to strings for comparing
                const attendeeIdStrings = meal.actualAttendees.map(a => a.student.toString());

                let processedCount = 0;
                for (const skippedStudentId of meal.skippedStudents) {
                    if (!attendeeIdStrings.includes(skippedStudentId.toString())) {
                        // Truly skipped! Give them credit
                        await User.findByIdAndUpdate(skippedStudentId, { $inc: { skippedMeals: 1 } });
                        processedCount++;
                    }
                }

                // Mark meal as processed
                meal.isSkipsProcessed = true;
                await meal.save();
                console.log(`[JOB] Finished Meal ${meal._id}. Handed out ${processedCount} valid skips.`);
            }
        }
    } catch (err) {
        console.error('[JOB] Error processing skips:', err);
    }
}, 60000); // Check every 60 seconds
// -----------------------------------------------------------

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});