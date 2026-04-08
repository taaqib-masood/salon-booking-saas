const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: {
        street: { type: String, required: true },
        area: { type: String, required: true },
        emirate: { type: String, required: true },
        country: { type: String, required: true }
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    workingHours: [{
        day: { type: String, required: true },
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    }],
    holidays: [Date],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
});

branchSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Branch', branchSchema);