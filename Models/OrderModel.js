import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: String, required: true, ref: 'User'},

  items: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', require: true},
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    discountPrice: { type: Number, required: true },
    variation: { type: String },

    // 🆕 Design customization fields
    designOption: { type: String, enum: ['UPLOAD', 'TEMPLATE', 'NONE'], default: 'UPLOAD' },
    uploadedImages: [{ type: String }] // Array of URLs
  }],

  shippingAddress: {
    // type: { type: String, enum: ['home', 'work', 'other'] },
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    contactName: String,
    contactEmail: String,
    contactPhone: String
  }, 

  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'cash_on_delivery', 'wallet'],
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  subTotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  trackingNumber: { type: String },
  trackingHistory: [{
    status: String,
    location: String,
    note: String,
    date: { type: Date, default: Date.now }
  }],

  notes: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  strictPopulate: false,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
