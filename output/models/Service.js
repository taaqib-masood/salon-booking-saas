const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    name_en: { type: String },
    name_ar: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'ServiceCategory' },
    description_en: { type: String },
    description_ar: { type: String },
    duration: { type: Number }, // in minutes
    price: { type: Number }, // AED
    vatInclusive: { type: Boolean, default: true },
    branches: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    isActive: { type: Boolean },
    isDeleted: { type: Boolean }
}, { timestamps: true });

serviceSchema.index({ category: 1 });
serviceSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Service', serviceSchema);