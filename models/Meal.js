const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner'],
        required: true
    },
    menuItems: {
        type: [String],
        required: true
    },
    attendingStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    skippedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isRsvpLocked: {
        type: Boolean,
        default: false
    },
    isSkipsProcessed: {
        type: Boolean,
        default: false
    },
    actualAttendees: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        entryTime: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Meal', mealSchema);