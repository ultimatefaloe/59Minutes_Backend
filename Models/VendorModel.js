import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const vendorSchema = new mongoose.Schema({
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
  businessAddress2: {
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
  updatedAt: { type: Date, default: Date.now },
  resetToken: { type: String, default: undefined} ,
  resetTokenExpires: { type: Date, default: undefined },
  invalidResetAttempts: { type: Number, default: 0 },
  resetBlockedUntil: { type: Date },
  passwordChangedAt: { type: Date},
  role: { type: String, enum: ['vendor', 'admin'], default: 'vendor' },
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

vendorSchema.plugin(mongoosePaginate);
const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
