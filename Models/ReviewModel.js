import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: { type: String },
  comment: { type: String },
  images: [{ type: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
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

const Review = mongoose.model('Review', reviewSchema);

export default Review;
