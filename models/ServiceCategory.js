const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
    name_en: {
        type: String,
        required: true
    },
    name_ar: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    displayOrder: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);