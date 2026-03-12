var fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const Meal = require('./models/Meal');

mongoose.connect(process.env.MONGO_URI);

async function run() {
    let out = [];
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        const meals = await Meal.find({
            date: { $gte: today, $lt: dayAfterTomorrow }
        }).sort({ date: 1, type: 1 });

        out.push(`Found ${meals.length} meals for today and tomorrow.`);
        meals.forEach(m => {
            out.push(`- ID: ${m._id}, Date: ${m.date}, Type: ${m.type}, Items: ${m.menuItems.join(', ')}`);
        });

    } catch (err) {
        out.push(err.toString());
    } finally {
        fs.writeFileSync('db_out_utf8.txt', out.join('\n'), 'utf-8');
        mongoose.disconnect();
    }
}
run();
