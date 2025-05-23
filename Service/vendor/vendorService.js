import Vendor from '../../Models/VendorModel.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Middleware from '../../Middleware/middleware.js';
import { sendEmail } from '../../utils/mailer.js';


const vendorService = {
    // Create a new vendor
    create: async (vendorData) => {
        try {
            const { businessName, businessDescription, businessPhoneNumber, businessEmail, businessPassword, agreeToTerms } = vendorData;
    
            if (!businessName || !businessDescription || !businessPhoneNumber || !businessEmail || !businessPassword) {
                return { 
                    success: false, 
                    error: 'Missing required fields',
                    code: 400
                };
            }

            if(!agreeToTerms){
                return{
                    success: false,
                    error: 'Agree to the terms and condition',
                    code: 400
                }
            }

            const hashedPassword = await bcrypt.hash(businessPassword, 10);
            vendorData.businessPassword = hashedPassword;

            // Check if vendor already exists
            const existingVendor = await Vendor.findOne({ businessEmail });
            if (existingVendor) {
                return {
                    success: false,
                    error: 'Vendor already exists with this email',
                    code: 409
                };
            }
    
            // Create new vendor
            const newVendor = new Vendor(vendorData);
            const savedVendor = await newVendor.save();
    
            return { 
                success: true,
                data: savedVendor
            };
    
        } catch (error) {
            console.error('Error creating vendor:', error);
            return {
                success: false,
                error: error.message,
                code: error.code === 11000 ? 409 : 400
            };
        }
    },

    // Login
    login: async(vendorData) => {
        try {
            const { businessEmail, businessPassword } = vendorData;

            if (!businessEmail || !businessPassword) {
                return {
                    success: false,
                    error: 'Missing email or password',
                    code: 400
                };
            }

            // Find vendor by email
            const vendor = await Vendor.findOne({ businessEmail });
            if (!vendor) {
                return {
                    success: false,
                    error: 'Vendor not found',
                    code: 404
                };
            }

            // Check if password matches
            const isMatch = await bcrypt.compare(businessPassword, vendor.businessPassword);
            if (!isMatch) {
                return {
                    success: false,
                    error: 'Invalid credentials',
                    code: 401
                };
            }

            // Generate JWT token
            const token = Middleware.generateToken(vendor);

            return {
                success: true,
                data: { token, vendor }
            };

        } catch (error) {
            console.error('Error during login:', error);
            return {
                success: false,
                error: error.message,
                code: 500
            };
        }
    },

    // Get vendor by ID
    get: async (id) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid vendor ID', code: 400 };
            }
            
            const vendor = await Vendor.findById(id)
                .populate('products', 'name price images');
            
            if (!vendor) {
                return { success: false, error: 'Vendor not found', code: 404 };
            }
            
            return { success: true, data: vendor };
        } catch (error) {
            console.error('Error fetching vendor:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // Update vendor
    update: async (email, updateData) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid vendor ID', code: 400 };
            }

            // Prevent certain fields from being updated
            if (updateData.businessPassword ){
                delete updateData.businessPassword
            };
            delete updateData._id;
            delete updateData.createdAt;
            delete updateData.verificationStatus; // Special permissions needed for this

            const updatedVendor = await Vendor.findByIdAndUpdate(
                id, 
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            );

            if (!updatedVendor) {
                return { success: false, error: 'Vendor not found', code: 404 };
            }

            return { success: true, data: updatedVendor };
        } catch (error) {
            console.error('Error updating vendor:', error);
            return { 
                success: false, 
                error: error.message,
                code: error.code === 11000 ? 409 : 400 
            };
        }
    },

    // Password reset token 
    resetToken: async ( email ) => {

        try {

            const vendor = await Vendor.findOne({businessEmail: email});

            if(!vendor) throw new Error('Vendor not found');

            const token = Math.floor(100000 + Math.random() * 900000).toString();
            const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

            vendor.resetToken = token;
            vendor.resetTokenExpires = tokenExpires;
            vendor.save();

            const tokenHTML = `
                <div>>img src'' width='100%'></div>
                <div>
                    Your password reset code is: <br/>
                    <span style="color:Yellow;font-size:28px;background-color:black">${token}</span>
                    <p>valid till ${tokenExpires}</p>
                </div>
            `
            try {
                const emailStatus = await sendEmail({
                to: email,
                subject: 'Password reset verification code',
                    html: tokenHTML,
                })

                if (!emailStatus).accepted.length{
                    console.warn('Failed to send verification code: ', emailStatus)
                }

            } catch (mailErr) {
                console.error('Error sending verification code', mailErr);
            }

            return { message: `Code sent to ${email}`}

        } catch (error) {
            console.error('Error updating password:', error);
            return { 
                success: false, 
                error: error.message,
                code: error.code === 11000 ? 409 : 400 
            };
        }
        
    },

    //forget password reset
    resetpassword: async ( data ) => {
        const {email, newPassword, token } = data

        try {
            const vendor =  await Vendor.findOne({businessEmail: email});

            if(!vendor) throw new Error('Invalid vendor email')

            const isExpired = !vendor.resetTokenExpires || vendor.resetTokenExpires > Date.now();

            if (token !== vendor.resetToken || isExpired){
                throw new Error('Invalid or expired code')
            };

            const hashedPassword = await bcrypt.hash(newPassword, 10)

            vendor.businessPassword = hashedPassword;
            vendor.resetToken = undefined;
            vendor.resetTokenExpires = undefined;
            await vendor.save()

            return {message: 'Password has been reset successfully'};
        } catch (error) {
            
        }

    },

    // Delete vendor (soft delete)
    delete: async (id) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { success: false, error: 'Invalid vendor ID', code: 400 };
            }

            const deletedVendor = await Vendor.findByIdAndUpdate(
                id,
                { status: 'inactive' }, // Soft delete
                { new: true }
            );
            
            if (!deletedVendor) {
                return { success: false, error: 'Vendor not found', code: 404 };
            }
            
            return { success: true, data: { message: 'Vendor deactivated successfully' } };
        } catch (error) {
            console.error('Error deleting vendor:', error);
            return { success: false, error: error.message, code: 500 };
        }
    },

    // List vendors with pagination and filtering
    list: async ({ 
        page = 1, 
        limit = 10, 
        sort = '-createdAt',
        status = 'active',
        verified = null,
        search = ''
    }) => {
        try {
            const query = { status };
            
            if (verified !== null) {
                query.verificationStatus = verified ? 'verified' : { $ne: 'verified' };
            }

            if (search) {
                query.$or = [
                    { businessName: { $regex: search, $options: 'i' } },
                    { 'businessAddress.city': { $regex: search, $options: 'i' } }
                ];
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort,
                populate: {
                    path: 'products',
                    select: 'name price images status',
                    match: { status: 'published' }
                }
            };

            const vendors = await Vendor.paginate(query, options);

            return { 
                success: true, 
                data: {
                    vendors: vendors.docs,
                    total: vendors.totalDocs,
                    pages: vendors.totalPages,
                    page: vendors.page
                }
            };
        } catch (error) {
            console.error('Error listing vendors:', error);
            return { success: false, error: error.message, code: 500 };
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