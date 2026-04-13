import mongoose from 'mongoose';
const { Schema } = mongoose;

const posTerminalSchema = new Schema({
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    terminalId: { type: String, unique: true, required: true },
    provider: { type: String, enum: ['square', 'stripe_terminal', 'manual'], required: true },
    locationId: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    lastSeenAt: Date,
});

posTerminalSchema.index({ branch: 1 });

export const PosTerminal = mongoose.model('PosTerminal', posTerminalSchema);