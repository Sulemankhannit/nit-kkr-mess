const mongoose = require('mongoose');

// While the Meal schema handles the daily individual meals, this Menu schema can be used
// if we want to store the "Master Menu" templates that get uploaded every week/month.
const menuSchema = new mongoose.Schema({
    weekStartDate: {
        type: Date,
        required: true
    },
    weekEndDate: {
        type: Date,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Storing the JSON structure of the weekly menu
    weeklyData: {
        type: mongoose.Schema.Types.Mixed, 
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);
