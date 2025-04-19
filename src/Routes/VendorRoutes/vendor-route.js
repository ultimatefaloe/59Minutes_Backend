import express from "express";
import vendorService from "../../Service/vendor/vendorService.js";
import Middleware from '../../Middleware/middleware.js';

const vendorRouter = express.Router();

export const vendorRoute = (router) => {
    router.use('/vendor', vendorRouter);

    // Sign Up vendor
    vendorRouter.post('/signup', async (req, res) => {
        try {
            const vendorData = req.body;
            const response = await vendorService.create(vendorData);
    
            if (!response.success) {
                return res.status(response.code || 400).json({
                    success: response.success,
                    message: response.error || 'Vendor sign up failed',
                });
            }
    
            const token = Middleware.generateToken(response.data);
    
            return res.status(response.code || 201).json({
                success: response.success,
                message: 'Vendor signed up successfully',
                token,
                data: response.data
            });
    
        } catch (e) {
            console.error('Error creating vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    vendorRouter.post('/login', async (req, res) => {
        try {
            const { businessEmail, businessPassword } = req.body;
    
            // Call the login service
            const response = await vendorService.login({ businessEmail, businessPassword });
    
            if (!response.success) {
                return res.status(response.code || 400).json({
                    success: response.success,
                    message: response.error || 'Login failed'
                });
            }
    
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token: response.data.token,  // Return the generated token
                vendor: response.data.vendor // Optionally, you can return the vendor info
            });
    
        } catch (e) {
            console.error('Error during vendor login:', e);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    
    // GET vendor by ID
    vendorRouter.get('/:id', async (req, res) => {
        try {
            const response = await vendorService.get(req.params.id);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error fetching vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // UPDATE vendo()r
    vendorRouter.put('/:id', Middleware.authRequired(), async (req, res) => {
        try {
            const response = await vendorService.update(req.params.id, req.body);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error updating vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // DELETE (soft delete) vendor
    vendorRouter.delete('/:id', Middleware.authRequired(), async (req, res) => {
        try {
            const response = await vendorService.delete(req.params.id);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error deleting vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // LIST vendors with filters and pagination
    vendorRouter.get('/', async (req, res) => {
        try {
            const response = await vendorService.list(req.query);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error listing vendors ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // VERIFY vendor (admin use)
    vendorRouter.patch('/verify/:id', Middleware.authRequired(), async (req, res) => {
        try {
            const { status, adminId } = req.body;
            const response = await vendorService.verify(req.params.id, status, adminId);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error verifying vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // GET vendor statistics
    vendorRouter.get('/stats/:vendorId', async (req, res) => {
        try {
            const response = await vendorService.getStats(req.params.vendorId);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error getting vendor stats ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
};
