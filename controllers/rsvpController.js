const Meal = require('../models/Meal');
const User = require('../models/User');

// Helper to determine the "Meal Start Time".
// In a real system, you'd store the actual start time (e.g., 8:00 AM, 1:00 PM, 8:00 PM) in the database.
// For brevity, we map the "type" to a standard time on the meal's date.
const getMealStartTime = (mealDate, type) => {
    const time = new Date(mealDate);
    if (type === 'Breakfast') time.setHours(8, 0, 0, 0); // 8:00 AM
    else if (type === 'Lunch') time.setHours(13, 0, 0, 0); // 1:00 PM
    else if (type === 'Dinner') time.setHours(20, 0, 0, 0); // 8:00 PM
    return time;
};

exports.toggleRsvp = async (req, res) => {
    try {
        const { mealId } = req.params;
        const { status } = req.body; // "Attending" or "Skipping"
        const userId = req.user.id;

        const meal = await Meal.findById(mealId);
        if (!meal) return res.status(404).json({ message: 'Meal not found' });

        // Check the 3-hour lock window
        const mealStartTime = getMealStartTime(meal.date, meal.type);
        const currentTime = new Date();
        const diffInHours = (mealStartTime - currentTime) / (1000 * 60 * 60);

        if (diffInHours < 3 && diffInHours > 0) {
            return res.status(400).json({ message: 'RSVP is locked. It must be done at least 3 hours before the meal starts.' });
        }
        if (currentTime > mealStartTime) {
            return res.status(400).json({ message: 'This meal has already passed' });
        }

        // Check current RSVP status
        const isAttending = meal.attendingStudents.includes(userId);
        const isSkipping = meal.skippedStudents.includes(userId);

        if (status === 'Attending') {
            if (isAttending) return res.status(400).json({ message: 'Already marked as attending' });

            // Remove from skipped if was there
            if (isSkipping) {
                meal.skippedStudents.pull(userId);
            }
            meal.attendingStudents.push(userId);

        } else if (status === 'Skipping') {
            if (isSkipping) return res.status(400).json({ message: 'Already marked as skipping' });

            // Remove from attending if was there
            if (isAttending) {
                meal.attendingStudents.pull(userId);
            }
            meal.skippedStudents.push(userId);
            // Skip increments are now handled by the cron job after the meal ends
        } else {
            return res.status(400).json({ message: 'Invalid status. Must be Attending or Skipping.' });
        }

        await meal.save();
        res.status(200).json({
            message: `Successfully marked as ${status}`,
            meal
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
