import mongoose from 'mongoose';
const { Schema } = mongoose;

// Define the receipt schema
const ReceiptSchema = new Schema({
  receiptNumber: String,
  date: Date,
  branch: {
    name: String,
    address: String,
    phone: String
  },
  customer: {
    name: String,
    phone: String
  },
  items: [{
    service: String,
    stylist: String,
    duration: Number,
    subtotal: Number,
    vatAmount: Number,
    total: Number
  }],
  subtotalAll: Number,
  vatAll: Number,
  discountAmount: Number,
  loyaltyRedeemed: Boolean,
  grandTotal: Number,
  paymentMethod: String,
  currency: { type: String, default: 'AED' }
});

// Create the Receipt model
const Receipt = mongoose.model('Receipt', ReceiptSchema);

export function generateReceipt(appointment) {
  // Implement your logic here to create a receipt object from appointment data
}

export function formatReceiptText(receipt) {
  // Implement your logic here to create a plain text version of the receipt for WhatsApp/SMS
}