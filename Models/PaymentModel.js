import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['card', 'bank_transfer', 'cash_on_delivery', 'wallet'], required: true },
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    paidAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;