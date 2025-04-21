import User from '../../Models/UserModel.js';
import mongoose from 'mongoose';

export default {
    create: async (userData) => {
        try {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                return {
                success: false,
                error: 'User already exists',
                code: 409,
                };
            }
        
            // If no existing user, proceed to create a new one
            const newUser = new User(userData);
            const savedUser = await newUser.save();
            return { success: true, data: savedUser };
        } catch (error) {
            console.error('Error creating user:', error);
            return {
                success: false,
                error: error.message,
                code: 400,
            };
        }
    },
  
    // Get user by ID
    get: async (id) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid user ID', code: 400 };
            }
            
            const user = await User.findById(id)
                .select('-password')
                .populate('wishlist', 'name price images')
                .populate('cart.items.productId', 'name price images');
            
            if (!user) {
                return { success: false, error: 'User not found', code: 404 };
            }
            
            return { success: true, data: user };
        } catch (error) {
            console.error('Error fetching user:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Get user by email (for authentication)
    getByEmail: async (email) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return { success: false, error: 'User not found', code: 404 };
            }
            return { success: true, data: user };
        } catch (error) {
            console.error('Error fetching user by email:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Update user
    update: async (id, updateData) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid user ID', code: 400 };
            }

            // Prevent role updates through this endpoint
            if (updateData.role) {
                delete updateData.role;
            }

            const updatedUser = await User.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                return { success: false, error: 'User not found', code: 404 };
            }

            return { success: true, data: updatedUser };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message, code: 400 };
        }
    },

    // Delete user
    delete: async (id) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid user ID', code: 400 };
            }

            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                return { success: false, error: 'User not found', code: 404 };
            }

            return { success: true, data: { message: 'User deleted successfully' } };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

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