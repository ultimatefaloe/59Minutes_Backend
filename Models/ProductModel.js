import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, require: true },
  discountPercent: { type: Number },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  images: [{ type: String }],
  stock: { type: Number, required: true },
  material: [{ type: String, required: true }],
  color: [{ type: String, required: true }],
  attributes: [{
    name: String,
    values: [String]
  }],
  variations: [{
    combination: [String],
    price: Number,
    stock: Number,
    sku: String
  }],
  specifications: [{
    key: String,
    value: String
  }],
  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  status: { type: String, enum: ['draft', 'published', 'out_of_stock', 'discontinued'], default: 'draft' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    versionKey: false,  // Optionally remove the __v field
    transform: (doc, ret) => {
      ret.id = ret._id.toString();  // Convert _id to id
      delete ret._id;  // Optionally remove _id from the returned object
    }
  },
  toObject: {
    virtuals: true,
    versionKey: false,  // Optionally remove the __v field
    transform: (doc, ret) => {
      ret.id = ret._id.toString();  // Convert _id to id
      delete ret._id;  // Optionally remove _id from the returned object
    }
  }
});

productSchema.index({ name: 'text', description: 'text' });

productSchema.plugin(mongoosePaginate);

const Product = mongoose.model('Product', productSchema);

export default Product;
