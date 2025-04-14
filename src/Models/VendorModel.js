import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
    // vendorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    businessName: { type: String, required: true },
    businessEmail: { type: String, required: true },
    businessPhoneNumber: { type: Number, required: true },
    businessDescription: { type: String, required: true },
    businessPassword: { type: String, required: true },
    businessLogo: { type: String },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'Nigeria' },
      postalCode: String,
    },
    taxId: { type: String },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String
    },
    rating: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;