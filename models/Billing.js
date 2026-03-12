const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String, // e.g., "October 2023"
        required: true
    },
    baseFee: {
        type: Number,
        default: 4000 // Rs. 4000 assumed base fee
    },
    rebateDeductions: {
        type: Number,
        default: 0 // (e.g., Rs. 130 per official rebate)
    },
    rewardDeductions: {
        type: Number,
        default: 0 // (e.g., Rs. 20 per skipped meal reward)
    },
    extraCanteenPurchases: {
        type: Number,
        default: 0
    },
    totalBilled: {
        type: Number,
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Pre-save middleware to calculate the total bill automatically
billingSchema.pre('validate', function(next) {
    this.totalBilled = this.baseFee - this.rebateDeductions - this.rewardDeductions + this.extraCanteenPurchases;
    next();
});

module.exports = mongoose.model('Billing', billingSchema);
