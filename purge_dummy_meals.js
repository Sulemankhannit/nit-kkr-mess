require('dotenv').config();
const mongoose = require('mongoose');
const Meal = require('./models/Meal');

mongoose.connect(process.env.MONGO_URI);

async function purge() {
    try {
        const res = await Meal.deleteMany({ menuItems: "Testing Food" });
        console.log(`Deleted ${res.deletedCount} testing meals`);
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
purge();
