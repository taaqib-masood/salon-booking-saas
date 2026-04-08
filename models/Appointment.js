const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    guest: { name: String, phone: String },
    staff: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    endTime: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'pending' },
    subtotal: { type: Number },
    vatAmount: { type: Number },
    totalAmount: { type: Number },
    discountAmount: { type: Number },
    discountRef: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'partial', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'online'] },
    notes: { type: String },
    cancellationReason: { type: String },
    reminderSent: { type: Boolean, default: false },
    isGuest: { type: Boolean, default: false }
});

AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ staff: 1 });
AppointmentSchema.index({ customer: 1 });
AppointmentSchema.index({ branch: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);