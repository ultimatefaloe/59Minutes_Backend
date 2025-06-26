import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userSchema = new mongoose.Schema({
  uid: {type: String, required: true},
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phoneNumber: { type: String },
  avatar: { type: String },
  addresses: [{
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Nigeria' },
    postalCode: String,
    isDefault: { type: Boolean, default: false }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: {
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      selectedVariation: { type: String }
    }],
    totalPrice: { type: Number, default: 0 }
  },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  accountStatus: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

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

userSchema.plugin(mongoosePaginate);
const User = mongoose.model('User', userSchema);

export default User;
