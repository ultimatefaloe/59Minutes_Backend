import mongoose, { mongo } from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'promotion', 'system', 'account'], required: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // Could be order ID, product ID, etc.
    createdAt: { type: Date, default: Date.now }
  });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;