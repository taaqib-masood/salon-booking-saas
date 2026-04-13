const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    staff: { type: Schema.Types.ObjectId, ref: 'Staff' },
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    isPublished: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ staff: 1 });
reviewSchema.index({ service: 1 });

module.exports = mongoose.model('Review', reviewSchema);