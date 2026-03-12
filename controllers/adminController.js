const Meal = require('../models/Meal');
const Feedback = require('../models/Feedback');
const Rebate = require('../models/Rebate');
const User = require('../models/User');

exports.getCookSheet = async (req, res) => {
    try {
        // Fetch meals for today and tomorrow
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

        const meals = await Meal.find({
            date: { $gte: today, $lt: dayAfterTomorrow }
        }).sort({ date: 1 });

        // Get total number of active registered students
        const totalStudentsCount = await User.countDocuments({ role: 'student' });

        const formattedMeals = meals.map(meal => {
            // New logic: Everyone is assumed to be eating UNLESS they actively skipped.
            const calculatedHeadcount = totalStudentsCount - (meal.skippedStudents ? meal.skippedStudents.length : 0);

            return {
                _id: meal._id,
                date: meal.date,
                type: meal.type,
                name: meal.menuItems.join(', '),
                headcount: calculatedHeadcount,
                targetCookingVolume: calculatedHeadcount // Plates needed
            };
        });

        res.status(200).json({ cookSheet: formattedMeals });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        // 1. Food Saved Analytics
        // Mocking: Assume a base of 320 plates cooked per day in the past. 
        // We'll return 7 days of mocked data for the graph showing food saved in kg.
        const past7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        // Randomly generating saved kg amounts for the demo (e.g. 10 to 30 kg saved from predicted absence via Cook-Sheet)
        const foodSavedTrend = past7Days.map(date => ({
            date,
            savedKg: Math.floor(Math.random() * (30 - 10 + 1) + 10) // 10 to 30 kg saved
        }));

        // 2. Money Saved Analytics (Derived directly from Food Saved)
        // Let's assume every 1 kg of food saved translates to Rs. 50 saved.
        let totalMoneySavedByFood = 0;
        const moneySavedTrend = foodSavedTrend.map(day => {
            const dailySave = day.savedKg * 50;
            totalMoneySavedByFood += dailySave;
            return {
                date: day.date,
                savedAmount: dailySave
            };
        });

        // 3. Average Meal Ratings
        const feedbacks = await Feedback.find().populate('meal');
        let totalRating = 0;
        let ratingCount = 0;

        let mealRatingsMap = {}; // mealId -> { sum, count, name, type, date }
        let dailyRatingsMap = {}; // date(YYYY-MM-DD) -> { sum, count }

        feedbacks.forEach(f => {
            if (f.rating && f.meal) {
                totalRating += f.rating;
                ratingCount++;

                // Map for individual meals
                if (!mealRatingsMap[f.meal._id]) {
                    mealRatingsMap[f.meal._id] = { sum: 0, count: 0, name: f.meal.menuItems ? f.meal.menuItems.join(', ') : 'Unknown', type: f.meal.type, date: f.meal.date };
                }
                mealRatingsMap[f.meal._id].sum += f.rating;
                mealRatingsMap[f.meal._id].count++;

                // Map for daily trend
                const mealDateStr = new Date(f.meal.date).toISOString().split('T')[0];
                if (!dailyRatingsMap[mealDateStr]) {
                    dailyRatingsMap[mealDateStr] = { sum: 0, count: 0 };
                }
                dailyRatingsMap[mealDateStr].sum += f.rating;
                dailyRatingsMap[mealDateStr].count++;
            }
        });

        const overallAvgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

        // Sort all meals by average rating
        const allRatedMeals = Object.values(mealRatingsMap).map(data => ({
            name: data.name,
            type: data.type,
            date: data.date,
            avgRating: parseFloat((data.sum / data.count).toFixed(1))
        }));

        allRatedMeals.sort((a, b) => b.avgRating - a.avgRating);

        // Extract Top 3 and Bottom 3
        const top3Meals = allRatedMeals.slice(0, 3);
        const bottom3Meals = allRatedMeals.slice(-3).reverse(); // Worst at the top of the bad list

        // Process Daily Trend for the Last 7 Days chart
        const dailyRatingsTrend = past7Days.map(date => {
            if (dailyRatingsMap[date] && dailyRatingsMap[date].count > 0) {
                return {
                    date,
                    avgRating: parseFloat((dailyRatingsMap[date].sum / dailyRatingsMap[date].count).toFixed(1))
                };
            }
            return { date, avgRating: 0 }; // No ratings for that day
        });

        // 4. AI Predictor Alerts
        // Check tomorrow's dinner
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6; // Sunday or Saturday
        let aiAlerts = [];

        if (isWeekend) {
            aiAlerts.push('System Alert: Weekend approaching. Historical data shows a 30% drop in dinner attendance on weekends. Consider adjusting recommended food volume down by 25 kg.');
        } else {
            aiAlerts.push('System Alert: Standard weekday detected. Attendance usually remains stable at 90-95% capacity.');
        }

        res.status(200).json({
            analytics: {
                foodSavedTrend,             // For Bar Chart
                moneySavedTrend,            // For Line Chart
                moneySavedTotal: totalMoneySavedByFood,
                overallAvgRating,
                dailyRatingsTrend,          // For Line Chart replacing Doughnut
                top3Meals,                  // Hall of Fame Table
                bottom3Meals,               // Grievance Table
                aiAlerts                    // AI Predictor Box
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const { studentId } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const timeFloat = currentHour + (currentMinute / 60);

        let currentMealType = null;
        if (timeFloat >= 8.0 && timeFloat <= 9.0) currentMealType = 'Breakfast';       // 8:00 AM - 9:00 AM
        else if (timeFloat >= 12.5 && timeFloat <= 14.0) currentMealType = 'Lunch';    // 12:30 PM - 2:00 PM
        else if (timeFloat >= 20.0 && timeFloat <= 21.0) currentMealType = 'Dinner';   // 8:00 PM - 9:00 PM

        if (!currentMealType) {
            return res.status(400).json({ message: 'Attendance can only be marked during active meal times (Breakfast: 8-9AM, Lunch: 12:30-2PM, Dinner: 8-9PM).' });
        }

        // Find current specific meal for attendance
        let meal = await Meal.findOne({
            date: { $gte: today, $lt: tomorrow },
            type: currentMealType
        });

        // Fallback: If no strict time-based meal is found (e.g., testing at odd hours), 
        // just grab the most recently created meal for today to prevent errors.
        if (!meal) {
            meal = await Meal.findOne({
                date: { $gte: today, $lt: tomorrow }
            }).sort({ createdAt: -1 });
        }

        if (!meal) return res.status(404).json({ message: 'No active meal found for today' });

        // Validate Student ID
        if (!studentId || studentId.length !== 24) {
            return res.status(400).json({ message: 'Invalid Student QR/ID Payload' });
        }

        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ message: 'Student not found' });

        // Check if already marked present
        const alreadyAttended = meal.actualAttendees.some(a => a.student.toString() === studentId);
        if (alreadyAttended) {
            return res.status(400).json({ message: 'Student is already marked present for this meal' });
        }

        let remarks = [];

        // 1. Revert skip intention if applicable. We DO NOT decrement user.skippedMeals
        // because we haven't given them the skip credit yet (that happens when the meal ends).
        if (meal.skippedStudents.includes(studentId)) {
            meal.skippedStudents.pull(studentId);
            remarks.push('Student had RSVP\'d "Skip" but attended; Skip cancelled.');
        }

        // 2. Check for active rebate
        const activeRebate = await Rebate.findOne({
            user: studentId,
            status: 'approved',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        if (activeRebate) {
            // Treat as guest: penalty of Rs 130
            user.guestDues = (user.guestDues || 0) + 130;
            remarks.push('Student has an active rebate; charged as guest (Rs 130) for this meal.');
        }

        // Add to actual attendees
        meal.actualAttendees.push({ student: studentId, entryTime: new Date() });

        await meal.save();
        await user.save();

        res.status(200).json({
            message: 'Attendance marked successfully',
            remarks: remarks.length ? remarks : ['Regular attendance recorded']
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.verifyRewardQR = async (req, res) => {
    try {
        const { payload } = req.body; // In real app, payload contains QR string with user reference

        // Validate Reward Payload (Prefix format)
        if (!payload || !payload.startsWith('QR_REWARD_')) {
            return res.status(400).json({ message: 'Invalid Reward QR Code structure' });
        }

        const userId = payload.replace('QR_REWARD_', '');
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Student not found to verify reward' });

        if (!user.skippedMeals || user.skippedMeals < 2) {
            return res.status(400).json({ message: 'Student does not have enough skips (requires 2) to claim a reward.' });
        }

        // Deduct exactly 2 skips
        user.skippedMeals -= 2;
        await user.save();

        res.status(200).json({
            message: 'Reward verified successfully! Ice cream awarded.',
            remainingSkips: user.skippedMeals
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.searchStudent = async (req, res) => {
    try {
        const { rollNumber } = req.query;
        if (!rollNumber) return res.status(400).json({ message: 'Roll number is required' });

        // Email format: [rollNumber]@nitkkr.ac.in
        const emailPattern = new RegExp(`^${rollNumber}@nitkkr\\.ac\\.in$`, 'i');

        const student = await User.findOne({ email: emailPattern, role: 'student' }).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'No student found with this roll number.' });
        }

        // Gather extra stats for this student
        const approvedRebates = await Rebate.find({ user: student._id, status: 'approved' });

        // Calculate Live Prepay Balance
        const mealsAttended = await Meal.find({ 'actualAttendees.student': student._id });
        const attendedDatesSet = new Set();
        mealsAttended.forEach(m => {
            attendedDatesSet.add(new Date(m.date).toISOString().split('T')[0]);
        });

        let billedDays = 0;
        let rebatedDays = 0;

        attendedDatesSet.forEach(dateStr => {
            const mealDate = new Date(dateStr);
            let isRebated = false;
            for (const rebate of approvedRebates) {
                const rStart = new Date(rebate.startDate);
                rStart.setHours(0, 0, 0, 0);
                const rEnd = new Date(rebate.endDate);
                rEnd.setHours(23, 59, 59, 999);
                if (mealDate >= rStart && mealDate <= rEnd) {
                    isRebated = true;
                    break;
                }
            }
            if (isRebated) rebatedDays++;
            else billedDays++;
        });

        const baseFee = 4000;
        const dailyRate = 130;
        const attendedDeduction = billedDays * dailyRate;
        const guestDues = student.guestDues || 0;
        const totalExpenses = attendedDeduction + guestDues;

        // The student's live balance of their 4000 advance
        const currentBalance = baseFee - totalExpenses;

        res.status(200).json({
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
                skippedMeals: student.skippedMeals,
                guestDues: student.guestDues,
                approvedRebates: approvedRebates.length,
                currentBalance
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await User.findOneAndDelete({ _id: id, role: 'student' });

        if (!student) return res.status(404).json({ message: 'Student not found or already deleted' });

        // Housekeeping: remove their rebates.
        await Rebate.deleteMany({ user: id });

        res.status(200).json({ message: 'Student account and associated data successfully deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('meal', 'date type menuItems')
            .populate('user', 'name rollNumber email')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ feedbacks });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching feedback', error: error.message });
    }
};
