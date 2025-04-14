import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPercent: { type: Number },
    category: { type: String, ref: 'Category', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    images: [{ type: String }],
    stock: { type: Number, required: true },
    material: [{ type: String, required: true}],
    color: [{ type: String, required: true}],
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
  });

const Product = mongoose.model('Product', productSchema);

export default Product;