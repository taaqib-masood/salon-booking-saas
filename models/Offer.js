import mongoose from 'mongoose';
const { Schema } = mongoose;

const offerSchema = new Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true, index: true, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed_aed'], required: true },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    applicableServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    isActive: { type: Boolean, default: false }
});

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;