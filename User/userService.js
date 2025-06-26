import User from '../Models/UserModel.js';
import mongoose from 'mongoose';

export default {
  
    // Add to wishlist
    addToWishlist: async (userId, productId) => {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { $addToSet: { wishlist: productId } }, // $addToSet prevents duplicates
                { new: true }
            ).select('wishlist');
            
            return { success: true, data: user };
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Remove from wishlist
    removeFromWishlist: async (userId, productId) => {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { $pull: { wishlist: productId } },
                { new: true }
            ).select('wishlist');
            
            return { success: true, data: user };
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Update cart
    updateCart: async (userId, cartData) => {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { cart: cartData },
                { new: true }
            ).select('cart');
            
            return { success: true, data: user };
        } catch (error) {
            console.error('Error updating cart:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Clear cart
    clearCart: async (userId) => {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { 
                    cart: {
                        items: [],
                        totalPrice: 0
                    } 
                },
                { new: true }
            ).select('cart');
            
            return { success: true, data: user };
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, error: error.message, code: 500 };
        }
    }
};