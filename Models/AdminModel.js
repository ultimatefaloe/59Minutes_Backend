import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    permissions: {
      canManageProducts: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canManageVendors: { type: Boolean, default: false },
      canManageOrders: { type: Boolean, default: false },
      canManageContent: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false }
    },
    lastAccess: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;