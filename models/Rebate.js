const mongoose = require('mongoose');

const rebateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // We can explicitly track if this rebate has already been subtracted from a generated bill
    appliedToBill: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Rebate', rebateSchema);
