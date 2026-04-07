import mongoose from 'mongoose';
const { Schema } = mongoose;

const TenantSubscriptionSchema = new Schema({
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    plan: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['active', 'cancelled', 'expired', 'trialing'], 
        default: 'active' 
    },
    invoices: [{
        invoiceId: { type: String, required: true },
        amount: { type: Number, required: true },
        paidAt: { type: Date },
        url: { type: String }
    }]
});

TenantSubscriptionSchema.index({ tenant: 1 });

export default mongoose.model('TenantSubscription', TenantSubscriptionSchema);