import express from 'express';
import productService from '../../Service/product/productService.js';
import Middleware from '../../Middleware/middleware.js';
import Vendor from '../../Models/VendorModel.js';

const productRouter = express.Router();

export const productRoute = (router) => {
    router.use('/products', productRouter);

    // Create Product
    productRouter.post('/add-product/:vendorid', Middleware.authRequired(), async (req, res) => {
        const vendorId = req.params.vendorid;
        const productData = { ...req.body, vendor: vendorId };

        try {
            const vendor = await Vendor.findById(vendorId);
            if (!vendor) {
                return res.status(404).json({
                    success: false,
                    message: 'Vendor not found',
                });
            }

            const response = await productService.create(productData);
            if (!response.success) {
                return res.status(response.code || 400).json({
                    success: false,
                    message: response.error || 'Failed to add product',
                });
            }

            const newProduct = response.data;

            await Vendor.findByIdAndUpdate(
                vendorId,
                { $push: { products: newProduct._id } },
                { new: true }
            );

            return res.status(201).json({
                success: true,
                message: 'Product added successfully',
                data: newProduct,
            });
        } catch (error) {
            console.error('Error adding product:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    });

    // Get Product by ID
    productRouter.get('/:id', async (req, res) => {
        try {
            const response = await productService.get(req.params.id);

            if (!response.success) {
                return res.status(response.code).json({
                    success: false,
                    message: response.error
                });
            }

            return res.status(200).json({
                success: true,
                message: "Product fetched successfully",
                data: response.data
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    });

    // Update Product
    productRouter.patch('/edit/:id', Middleware.authRequired(), async (req, res) => {
        try {
            const productId = req.params.id;
            const vendorId = req.body.vendor;

            const vendor = await Vendor.findById(vendorId);
            if (!vendor) {
                return res.status(403).json({
                    success: false,
                    message: 'Vendor not found or unauthorized'
                });
            }

            delete req.body.vendor; // Prevent vendor change

            const product = await productService.getById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (!product.vendor || product.vendor.toString() !== vendor._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this product'
                });
            }

            const response = await productService.update(productId, req.body);
            if (!response.success) {
                return res.status(response.code || 400).json({
                    success: false,
                    message: response.error || 'Failed to update product'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: response.data
            });

        } catch (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    });

    // Delete Product
    productRouter.delete('/:id', Middleware.authRequired(), async (req, res) => {
        try {
            const productId = req.params.id;
            const vendorId = req.user.uid;

            const product = await productService.getById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found',
                });
            }

            if (product.vendorId !== vendorId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to delete this product',
                });
            }

            const response = await productService.delete(productId);

            if (!response.success) {
                return res.status(response.code).json({
                    success: false,
                    message: response.error
                });
            }

            return res.status(200).json({
                success: true,
                message: response.data.message
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    });

    // List Products
    productRouter.get('/', async (req, res) => {
        try {
            const response = await productService.list(req.query);

            if (!response.success) {
                return res.status(response.code).json({
                    success: false,
                    message: response.error
                });
            }

            return res.status(200).json({
                success: true,
                message: "Products fetched successfully",
                data: response.data
            });
        } catch (error) {
            console.error('Error listing products:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    });

    // Search Products
    productRouter.get('/search/:term', async (req, res) => {
        try {
            const response = await productService.search(req.params.term);

            if (!response.success) {
                return res.status(response.code).json({
                    success: false,
                    message: response.error
                });
            }

            return res.status(200).json({
                success: true,
                message: "Search results",
                data: response.data
            });
        } catch (error) {
            console.error('Error searching products:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    });

    // Get Products by Vendor
    productRouter.get('/vendor/:vendorId', async (req, res) => {
        try {
            const response = await productService.getByVendor(req.params.vendorId);

            if (!response.success) {
                return res.status(response.code).json({
                    success: false,
                    message: response.error
                });
            }

            return res.status(200).json({
                success: true,
                message: "Vendor products fetched successfully",
                data: response.data
            });
        } catch (error) {
            console.error('Error fetching vendor products:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    });
};
