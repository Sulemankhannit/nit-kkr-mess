const Meal = require('../models/Meal');

exports.createWeeklyMeals = async (req, res) => {
    try {
        const { startDate, menuData } = req.body;
        const start = new Date(startDate);
        const mealsToInsert = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach((day, index) => {
            const currentDate = new Date(start);
            currentDate.setDate(currentDate.getDate() + index);
            const dayMenu = menuData[day];

            if (dayMenu) {
                mealsToInsert.push({ date: currentDate, type: 'Breakfast', menuItems: dayMenu.breakfast });
                mealsToInsert.push({ date: currentDate, type: 'Lunch', menuItems: dayMenu.lunch });
                mealsToInsert.push({ date: currentDate, type: 'Dinner', menuItems: dayMenu.dinner });
            }
        });

        await Meal.insertMany(mealsToInsert);
        res.status(201).json({ message: 'Success! 21 meals generated.', mealsCreated: mealsToInsert.length });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTodayMeals = async (req, res) => {
    try {
        // IST is UTC+5:30 = 330 minutes ahead of UTC.
        // Meals are stored with dates at midnight UTC (from a date-only string like "2026-03-16").
        // We need to query a range that covers IST "today" and "tomorrow" in UTC terms.
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms

        // Get current IST time, then find start of IST day
        const nowUTC = Date.now();
        const nowIST = new Date(nowUTC + IST_OFFSET_MS);

        // Start of today in IST (midnight IST = previous day 18:30 UTC)
        const todayIST = new Date(nowIST);
        todayIST.setUTCHours(0, 0, 0, 0);
        const todayStartUTC = new Date(todayIST.getTime() - IST_OFFSET_MS);

        // Start of day after tomorrow in IST
        const dayAfterTomorrowIST = new Date(todayIST);
        dayAfterTomorrowIST.setUTCDate(dayAfterTomorrowIST.getUTCDate() + 2);
        const dayAfterTomorrowStartUTC = new Date(dayAfterTomorrowIST.getTime() - IST_OFFSET_MS);

        const meals = await Meal.find({
            date: {
                $gte: todayStartUTC,
                $lt: dayAfterTomorrowStartUTC
            }
        }).sort({ date: 1, type: 1 });

        res.status(200).json({ meals });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching daily meals', error: error.message });
    }
};