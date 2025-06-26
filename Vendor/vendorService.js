import Vendor from '../Models/VendorModel.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto'
import Middleware from '../Middleware/middleware.js';
import { sendEmail } from '../utils/mailer.js';
import { passwordValidator } from '../utils/passwordValidator.js';


const vendorService = {
  
    // List vendors with pagination and filtering

    list: async ({
        page = 1,
        limit = 10,
        sort = '-createdAt',
        verificationStatus = 'verified', // default to pending
        verified = null,
        search = ''
        } = {}) => {
        try {
            // 🔍 Build query filters
            const query = { verificationStatus };

            if (verified !== null) {
                query.verificationStatus = verified ? 'verified' : { $ne: 'verified' };
            }

            if (search) {
                query.$or = [
                    { businessName: { $regex: search, $options: 'i' } },
                    { 'businessAddress.city': { $regex: search, $options: 'i' } }
                ];
            }

            // ⚙️ Pagination & Population
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort,
                populate: {
                    path: 'products',
                    select: 'name price images status',
                    match: { status: 'published' } // Only include draft products
                }
            };

            // ✅ Paginate with query and options
            const vendors = await Vendor.paginate(query, options);

            // 🔁 Format output
            const formatted = vendors.docs.map(vendor => {
                const vendorObj = vendor.toObject();
                    return {
                        id: vendorObj._id.toString(),
                        businessName: vendorObj.businessName,
                        businessDescription: vendorObj.businessDescription,
                        businessPhoneNumber: vendorObj.businessPhoneNumber,
                        businessEmail: vendorObj.businessEmail,
                        hasProducts: Array.isArray(vendorObj.products) && vendorObj.products.length > 0,
                        products: (vendorObj.products || []).map(product => ({
                        id: product._id.toString(),
                        name: product.name,
                        price: product.price,
                        images: product.images
                        }))
                    };
            });

            return {
                success: true,
                data: {
                    vendors: formatted,
                    total: vendors.totalDocs,
                    page: vendors.page,
                    pages: vendors.totalPages
                }
            };
        } catch (error) {
            console.error('Error listing vendors:', error);
            return {
                success: false,
                error: error.message,
                code: 500
            };
        }
    },

    // Verify vendor (admin function)
    verify: async (id, status, adminId) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid vendor ID', code: 400 };
            }

            if (!['verified', 'rejected'].includes(status)) {
                return { success: false, error: 'Invalid verification status', code: 400 };
            }

            const updatedVendor = await Vendor.findByIdAndUpdate(
                id,
                { 
                    verificationStatus: status,
                    verifiedBy: adminId,
                    verifiedAt: Date.now() 
                },
                { new: true }
            );

            if (!updatedVendor) {
                return { success: false, error: 'Vendor not found', code: 404 };
            }

            return { success: true, data: updatedVendor };
        } catch (error) {
            console.error('Error verifying vendor:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Get vendor statistics
    getStats: async (vendorId) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(vendorId)) {
                return { success: false, error: 'Invalid vendor ID', code: 400 };
            }

            const stats = await Vendor.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(vendorId) } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'products',
                        foreignField: '_id',
                        as: 'productsData'
                    }
                },
                {
                    $project: {
                        totalProducts: { $size: '$productsData' },
                        activeProducts: {
                            $size: {
                                $filter: {
                                    input: '$productsData',
                                    as: 'product',
                                    cond: { $eq: ['$$product.status', 'published'] }
                                }
                            }
                        },
                        totalSales: 1,
                        rating: 1
                    }
                }
            ]);

            if (!stats.length) {
                return { success: false, error: 'Vendor not found', code: 404 };
            }

            return { success: true, data: stats[0] };
        } catch (error) {
            console.error('Error getting vendor stats:', error);
            return { success: false, error: error.message, code: 500 };
        }
    }
};

export default vendorService;