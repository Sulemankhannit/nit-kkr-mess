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
        // Find meals for today AND tomorrow
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2); // Start of the day after tomorrow

        const meals = await Meal.find({
            date: {
                $gte: today,
                $lt: dayAfterTomorrow
            }
        }).sort({ date: 1, type: 1 }); // Ensure they are sorted

        res.status(200).json({ meals });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching daily meals', error: error.message });
    }
};