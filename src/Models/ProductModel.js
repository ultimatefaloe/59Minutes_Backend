import mongoose, { mongo } from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: String },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    images: [{ type: String }],
    stock: { type: Number, required: true },
    sku: { type: String, unique: true },
    attributes: [{
      name: String,
      values: [String]
    }],
    variations: [{
      combination: [String], // e.g. ["Red", "XL"]
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

const Product = mongo.MongoDBCollectionNamespace('Product', productSchema);

module.exports = Product;