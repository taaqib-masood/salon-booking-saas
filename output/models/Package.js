import mongoose from 'mongoose';
const { Schema } = mongoose;

// Service schema can be defined here or imported if it's a separate model
// const ServiceSchema = new Schema({...});

const PackageSchema = new Schema(
  {
    name: String,
    description: String,
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }], // Assuming Service is another model
    totalSessions: Number,
    price: Number,
    validityDays: Number,
    isActive: Boolean,
  },
  { timestamps: true }
);

const CustomerPackageSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', index: true }, // Assuming Customer is another model
    package: { type: Schema.Types.ObjectId, ref: 'Package' },
    sessionsLeft: Number,
    purchasedAt: Date,
    expiresAt: Date,
    isActive: Boolean,
  },
  { timestamps: true }
);

export const Package = mongoose.model('Package', PackageSchema);
export const CustomerPackage = mongoose.model('CustomerPackage', CustomerPackageSchema);