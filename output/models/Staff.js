const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const staffSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, index: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'manager', 'receptionist', 'stylist'], 
        default: 'stylist' 
    },
    specialties: [{ type: String }],
    commissionRate: { type: Number, default: 20 },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    workingDays: [{ type: String }],
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
});

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;