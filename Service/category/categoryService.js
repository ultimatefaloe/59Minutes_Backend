import mongoose from 'mongoose';
import Category from '../../Models/CategoryModel.js';
import Product from '../../Models/ProductModel.js';

const categoryService = {
  // Create a new category
  create: async (data) => {
    try {
      if (!data.name) {
        return { success: false, error: 'Category name is required', code: 400 };
      }

      const existing = await Category.findOne({ name: data.name });
      if (existing) {
        return { success: false, error: 'Category already exists', code: 409 };
      }

      const newCategory = new Category(data);
      const saved = await newCategory.save();

      return { success: true, data: saved };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message, code: 500 };
    }
  },

  // Get all categories
  list: async () => {
    try {
      const categories = await Category.find().sort('name');
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error listing categories:', error);
      return { success: false, error: error.message, code: 500 };
    }
  },

  // Get product using categories
  getById: async (categoryId, options = {}) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return { success: false, error: 'Invalid category ID', code: 400 };
      }

      // Apply pagination defaults
      const limit = options.limit || 20;
      const page = options.page || 1;
      const skip = (page - 1) * limit;
      const sortField = options.sortField || 'createdAt';
      const sortOrder = options.sortOrder || -1;
      
      // Build sort object
      const sort = { [sortField]: sortOrder };
      
      // Check if category exists first to avoid unnecessary product queries
      const categoryExists = await Category.exists({ _id: categoryId });
      if (!categoryExists) {
        return { success: false, error: 'Category not found', code: 404 };
      }

      // Use lean() for better performance when you don't need Mongoose document features
      // Removed .cache() function that was causing the error
      const products = await Product.find({ category: categoryId })
        .select('name price images status stock slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination in a separate query
      const totalCount = await Product.countDocuments({ category: categoryId });
      
      return { 
        success: true, 
        data: products,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      };
      
    } catch (error) {
      console.error('Error fetching category products:', error);
      
      // More specific error handling
      if (error.name === 'MongoServerError') {
        return { success: false, error: 'Database error occurred', code: 500 };
      }
      return { success: false, error: 'An unexpected error occurred', code: 500 };
    }
  },

  // Update category
  update: async (id, updateData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid category ID', code: 400 };
      }

      const updated = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updated) {
        return { success: false, error: 'Category not found', code: 404 };
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, error: error.message, code: 500 };
    }
  },

  // Delete category
  delete: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: 'Invalid category ID', code: 400 };
      }

      const deleted = await Category.findByIdAndDelete(id);
      if (!deleted) {
        return { success: false, error: 'Category not found', code: 404 };
      }

      return { success: true, data: { message: 'Category deleted successfully' } };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: error.message, code: 500 };
    }
  }
};

export default categoryService;