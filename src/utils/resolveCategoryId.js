import mongoose from 'mongoose';
import Category from '../Models/categoryModel.js';

export const resolveCategoryId = async (categoryInput) => {
    if (!categoryInput) return null;

    const trimmedInput = categoryInput.trim();

    if (mongoose.Types.ObjectId.isValid(trimmedInput)) {
        const category = await Category.findById(trimmedInput);
        if (category) return category._id;
    }

    const categoryByName = await Category.findOne({ name: trimmedInput });
    if (categoryByName) return categoryByName._id;

    return null; // or throw new Error('Category not found');
};
