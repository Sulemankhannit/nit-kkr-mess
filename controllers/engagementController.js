const Poll = require('../models/Poll');
const Feedback = require('../models/Feedback');

// --- POLLING ---
exports.createPoll = async (req, res) => {
    try {
        const { question, options, durationMins } = req.body;

        if (!question || !options || options.length < 2) {
            return res.status(400).json({ message: 'A poll needs a question and at least 2 options.' });
        }

        const duration = parseInt(durationMins) || 60; // Default 60 mins
        const expiresAt = new Date(Date.now() + duration * 60 * 1000);

        const mappedOptions = options.map(opt => ({ name: opt, votes: 0 }));

        const newPoll = new Poll({
            question,
            options: mappedOptions,
            expiresAt
        });

        await newPoll.save();
        res.status(201).json({ message: 'Poll created successfully!', poll: newPoll });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getActivePolls = async (req, res) => {
    try {
        // Find polls that have not expired yet
        const polls = await Poll.find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });

        res.status(200).json({ polls });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.votePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const { optionId } = req.body;
        const userId = req.user.id;

        const poll = await Poll.findById(pollId);
        if (!poll || poll.expiresAt < new Date()) {
            return res.status(404).json({ message: 'Active poll not found or has expired' });
        }

        if (poll.votedUsers.includes(userId)) {
            return res.status(400).json({ message: 'You have already voted in this poll!' });
        }

        const option = poll.options.id(optionId);
        if (!option) return res.status(400).json({ message: 'Invalid option' });

        option.votes += 1;
        poll.votedUsers.push(userId);

        await poll.save();
        res.status(200).json({ message: 'Vote submitted successfully!', poll });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAdminPolls = async (req, res) => {
    try {
        const polls = await Poll.find().sort({ createdAt: -1 });
        res.status(200).json({ polls });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deletePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const result = await Poll.findByIdAndDelete(pollId);

        if (!result) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        res.status(200).json({ message: 'Poll deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- FEEDBACK ---
exports.submitFeedback = async (req, res) => {
    try {
        const { mealId } = req.params;
        const { rating, comments } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5.' });
        }

        // Check if user already rated this meal
        const existing = await Feedback.findOne({ user: userId, meal: mealId });
        if (existing) {
            return res.status(400).json({ message: 'You have already rated this meal!' });
        }

        const feedback = new Feedback({
            user: userId,
            meal: mealId,
            rating,
            comments
        });

        await feedback.save();
        res.status(201).json({ message: 'Thank you for your feedback!' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- LIVE CROWD METER ---
exports.getLiveCrowd = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find current meal based on time
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const timeFloat = currentHour + (currentMinute / 60);

        let currentMealType = null;
        if (timeFloat >= 8.0 && timeFloat <= 9.0) currentMealType = 'Breakfast';
        else if (timeFloat >= 12.5 && timeFloat <= 14.0) currentMealType = 'Lunch';
        else if (timeFloat >= 20.0 && timeFloat <= 21.0) currentMealType = 'Dinner';

        const Meal = require('../models/Meal');
        let meal = null;

        if (currentMealType) {
            meal = await Meal.findOne({
                date: { $gte: today, $lt: tomorrow },
                type: currentMealType
            });
        }

        if (!meal) {
            meal = await Meal.findOne({
                date: { $gte: today, $lt: tomorrow }
            }).sort({ createdAt: -1 });
        }

        if (!meal) {
            return res.status(200).json({ crowdCount: 0 });
        }

        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);

        // Count attendees whose entryTime is within the last 20 mins
        const recentAttendees = meal.actualAttendees.filter(a => new Date(a.entryTime) >= twentyMinsAgo);

        res.status(200).json({ crowdCount: recentAttendees });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- STUDENT ANALYTICS (Heatmap & Eco-Footprint) ---
exports.getStudentAnalytics = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Calculate Eco-Footprint from Skips
        // Assuming user.skippedMeals holds their lifetime total skips, or we calculate from DB.
        const User = require('../models/User');
        const user = await User.findById(studentId);
        const lifetimeSkips = user.skippedMeals || 0;
        const kgPerMeal = 0.4; // Assume 400g of food saved per skipped meal
        const totalSavedKg = (lifetimeSkips * kgPerMeal).toFixed(1);

        // 2. Calculate 30-Day Heatmap
        // Look back over the last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const Meal = require('../models/Meal');
        // Fetch all meals in the last 30 days
        const recentMeals = await Meal.find({
            date: { $gte: thirtyDaysAgo, $lte: today }
        }).sort({ date: 1 });

        // Map them by date string "YYYY-MM-DD" -> { type: 'breakfast|lunch|dinner', attended: boolean }
        let heatmapData = [];

        // Let's create an array of the last 30 days, 1 entry per day, assessing if they ate *any* meal that day
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Find meals occurring on this date
            const mealsOnDate = recentMeals.filter(m => new Date(m.date).toISOString().split('T')[0] === dateStr);

            if (mealsOnDate.length === 0) {
                heatmapData.push({ date: dateStr, status: 'unknown' }); // No meals existed on this day (e.g. holiday or pre-launch)
                continue;
            }

            // Check if student attended ANY of the meals on this date
            let didAttend = false;
            for (const meal of mealsOnDate) {
                const attended = meal.actualAttendees.some(a => a.student.toString() === studentId.toString());
                if (attended) {
                    didAttend = true;
                    break;
                }
            }

            heatmapData.push({
                date: dateStr,
                status: didAttend ? 'attended' : 'skipped'
            });
        }

        res.status(200).json({
            analytics: {
                ecoFootprint: {
                    totalSkips: lifetimeSkips,
                    savedKg: totalSavedKg,
                    impactMessage: `Your accurate RSVPs have prevented ${totalSavedKg}kg of food waste!`
                },
                heatmap: heatmapData
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
