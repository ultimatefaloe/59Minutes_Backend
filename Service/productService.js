import mongoose from 'mongoose';
import Product from '../Models/ProductModel.js';
import Category from '../Models/CategoryModel.js';
import Review from '../Models/ReviewModel.js'
const productService = {
    // Create a new product
    create: async (productData) => {
        try {
          // Validate required fields
          const requiredFields = ['name', 'description', 'price', 'category', 'vendor', 'stock'];
          for (const field of requiredFields) {
            if (!productData[field]) {
              return {
                success: false,
                error: `Missing required field: ${field}`,
                code: 400,
              };
            }
          }
    
          const newProduct = new Product(productData);
          const savedProduct = await newProduct.save();
          return { success: true, data: savedProduct };
        } catch (error) {
          console.error('Error creating product:', error);
          return {
            success: false,
            error: error.message,
            code: error.code === 11000 ? 409 : 400, // 409 for duplicate key
          };
        }
    },

    // Get product by ID
    getById: async (id) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid product ID', code: 400 };
            }
            
            const product = await Product.findById(id)
                .populate('category', '_id name') // Populate full info
                .populate('vendor', '_id name')
                .populate('reviews', 'rating comment');
            
            if (!product) {
                return { success: false, error: 'Product not found', code: 404 };
            }
            
            return { success: true, data: product };
        } catch (error) {
            console.error('Error fetching product:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },
    

    // Update product
    update: async (id, updateData) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid product ID', code: 400 };
            }
    
            // Prevent updates to immutable or sensitive fields
            delete updateData._id;
            delete updateData.createdAt;
            delete updateData.vendor;
    
            const updatedProduct = await Product.findByIdAndUpdate(
                id, 
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            );
    
            if (!updatedProduct) {
                return { success: false, error: 'Product not found', code: 404 };
            }
    
            return { success: true, data: updatedProduct };
        } catch (error) {
            console.error('Error updating product:', error);
            return { 
                success: false, 
                error: error.message,
                code: error.code === 11000 ? 409 : 400 
            };
        }
    },

    // Delete product
    delete: async (id) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid product ID', code: 400 };
            }

            const deletedProduct = await Product.findByIdAndDelete(id);
            
            if (!deletedProduct) {
                return { success: false, error: 'Product not found', code: 404 };
            }
            
            return { success: true, data: { message: 'Product deleted successfully' } };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // List products with pagination, filtering and sorting
    list: async ({ 
        page = 1, 
        limit = 0, // 0 = return all documents
        sort = '-createdAt', 
        search = '',
        category = null,
        minPrice = 0,
        maxPrice = Infinity,
        status = 'published'
        } = {}) => {
        try {
            const query = {
                price: { $gte: minPrice, $lte: maxPrice }
            };
    
            if (status) {
                query.status = status;
            }
    
            if (category) {
                query.category = category;
            }
    
            if (search) {
                query.$text = { $search: search };
            }
    
            const options = {
                page: parseInt(page),
                limit: parseInt(limit), // If limit = 0, mongoose-paginate returns all
                sort,
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'vendor', select: 'name' }
                ]
            };
    
            const products = await Product.paginate(query, options);
    
            return { 
                success: true, 
                data: {
                    products: products.docs,
                    total: products.totalDocs,
                    pages: products.totalPages,
                    page: products.page
                }
            };
        } catch (error) {
            console.error('Error listing products:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },
    
    // Search products by text
    search: async (searchTerm, limit = 25) => {
        try {
            const products = await Product.find(
                { $text: { $search: searchTerm } },
                { score: { $meta: 'textScore' } }
            )
            .sort({ score: { $meta: 'textScore' } })
            .limit(parseInt(limit))
            .select('name price images rating');

            return { success: true, data: products };
        } catch (error) {
            console.error('Error searching products:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Get products by vendor
    getByVendor: async (vendorId) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(vendorId)) {
                return { success: false, error: 'Invalid vendor ID', code: 400 };
            }

            const products = await Product.find({ vendor: vendorId })
                .select('name price images status stock')
                .sort('-createdAt');

            return { success: true, data: products };
        } catch (error) {
            console.error('Error fetching vendor products:', error);
            return { success: false, error: error.message, code: 500 };
        }
    }
};

export default productService;