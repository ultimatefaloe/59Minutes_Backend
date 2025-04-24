import mongoose from 'mongoose';
import Category from '../Models/CategoryModel.js';

export const resolveCategoryId = async(identifier) => {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const category = await Category.findById(identifier).select('_id').lean();
      return category?._id;
    }
    
    let category = await Category.findOne({ 
      slug: identifier.toLowerCase().trim() 
    }).select('_id').lean();
    
    if (!category) {
      category = await Category.findOne({ 
        name: { $regex: new RegExp(`^${identifier}$`, 'i') } 
      }).select('_id').lean();
    }
    
    return category?._id;
};