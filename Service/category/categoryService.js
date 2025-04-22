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

  // Get category by ID
  getById: async (categoryId) => {
    try {
      // Check if the category ID is valid
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return { success: false, error: 'Invalid category ID', code: 400 };
      }

      // Find products in the given category
      const products = await Product.find({ category: categoryId })
        .select('name price images status stock')
        .sort('-createdAt');

      // Return an empty array if no products are found
      if (products.length === 0) {
        return { success: true, data: [] }; // Return empty array if no products found
      }

      // Return products if found
      return { success: true, data: products };
      
    } catch (error) {
      // Log and handle error
      console.error('Error fetching category products:', error);
      
      // Return more specific error messages based on error type
      if (error.name === 'MongoError') {
        return { success: false, error: 'Database error occurred', code: 500 };
      }
      
      // Generic error message if something unexpected happens
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