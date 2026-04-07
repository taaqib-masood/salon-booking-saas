import mongoose from 'mongoose';
const { Schema } = mongoose;

const tenantSchema = new Schema({
  name: String,
  slug: { type: String, unique: true },
  ownerName: String,
  ownerEmail: String,
  ownerPhone: String,
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
  },
  planExpiresAt: Date,
  isActive: Boolean,
  settings: {
    currency: String,
    vatRate: Number,
    timezone: String,
    weekendDays: [String],
    loyaltyEnabled: Boolean,
    whatsappEnabled: Boolean,
  },
  branchLimit: Number,
  staffLimit: Number,
  createdAt: { type: Date, default: Date.now },
});

tenantSchema.index({ slug: 1 });

export const Tenant = mongoose.model('Tenant', tenantSchema);