import mongoose from 'mongoose';
const { Schema } = mongoose;

const notificationSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    type: { 
        type: String, 
        enum: ['booking_confirmation', 'reminder', 'cancellation', 'waitlist_available', 'loyalty_update'] 
    },
    channel: { 
        type: String, 
        enum: ['whatsapp', 'sms', 'email'] 
    },
    status: { 
        type: String, 
        enum: ['pending', 'sent', 'failed'], 
        default: 'pending' 
    },
    scheduledAt: Date,
    sentAt: Date,
    payload: Schema.Types.Mixed,
    errorMessage: String
});

notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledAt: 1 });

export default mongoose.model('Notification', notificationSchema);