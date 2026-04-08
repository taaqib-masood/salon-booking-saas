const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoyaltyTransactionSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    points: { type: Number, required: true },
    type: { 
        type: String, 
        enum: ['earn', 'redeem', 'expire', 'bonus'], 
        required: true 
    },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    description: { type: String },
    balance: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

LoyaltyTransactionSchema.index({ customer: 1 });

module.exports = mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);