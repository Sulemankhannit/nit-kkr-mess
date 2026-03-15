const Meal = require('../models/Meal');

exports.createWeeklyMeals = async (req, res) => {
    try {
        const { startDate, menuData } = req.body;

        // Parse startDate as UTC midnight to avoid timezone issues
        const start = new Date(startDate + 'T00:00:00.000Z');
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const ONE_WEEK_MS = 7 * ONE_DAY_MS;

        // Calculate last moment of the month (UTC)
        const year = start.getUTCFullYear();
        const month = start.getUTCMonth(); // 0-indexed
        const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

        // Prevent duplicate uploads: check if meals already exist from startDate onwards this month
        const existing = await Meal.findOne({ date: { $gte: start, $lte: monthEnd } });
        if (existing) {
            return res.status(400).json({
                message: `Meals already exist for this period (from ${existing.date.toDateString()}). Delete existing meals first or choose a different start date.`
            });
        }

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealsToInsert = [];
        let weeksGenerated = 0;

        // Repeat the weekly template for every week until end of month
        let weekStartMs = start.getTime();

        while (weekStartMs <= monthEnd.getTime()) {
            days.forEach((day, index) => {
                const currentDate = new Date(weekStartMs + index * ONE_DAY_MS);

                // Only add days that fall within the month
                if (currentDate.getTime() <= monthEnd.getTime()) {
                    const dayMenu = menuData[day];
                    if (dayMenu) {
                        mealsToInsert.push({ date: currentDate, type: 'Breakfast', menuItems: dayMenu.breakfast });
                        mealsToInsert.push({ date: currentDate, type: 'Lunch', menuItems: dayMenu.lunch });
                        mealsToInsert.push({ date: currentDate, type: 'Dinner', menuItems: dayMenu.dinner });
                    }
                }
            });

            weeksGenerated++;
            weekStartMs += ONE_WEEK_MS;
        }

        await Meal.insertMany(mealsToInsert);
        res.status(201).json({
            message: `Success! ${mealsToInsert.length} meals generated across ${weeksGenerated} week(s) until end of ${start.toLocaleString('default', { month: 'long', timeZone: 'UTC' })}.`,
            mealsCreated: mealsToInsert.length,
            weeksGenerated
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getTodayMeals = async (req, res) => {
    try {
        // IST is UTC+5:30 = 330 minutes ahead of UTC.
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

        const nowUTC = Date.now();
        const nowIST = new Date(nowUTC + IST_OFFSET_MS);

        const todayIST = new Date(nowIST);
        todayIST.setUTCHours(0, 0, 0, 0);
        const todayStartUTC = new Date(todayIST.getTime() - IST_OFFSET_MS);

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