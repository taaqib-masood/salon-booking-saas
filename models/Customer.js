const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, unique: true, index: true },
    email: { type: String, required: true },
    passwordHash: { type: String },
    preferredLanguage: { type: String, enum: ['en', 'ar'], default: 'en' },
    preferredStylist: { type: Schema.Types.ObjectId, ref: 'Staff' },
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false }
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;