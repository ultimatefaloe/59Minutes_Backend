import express from "express";
import vendorService from "../../Service/vendor/vendorService.js";
import Middleware from '../../Middleware/middleware.js';

const vendorRouter = express.Router();

export const vendorRoute = (router) => {
    router.use('/vendor', vendorRouter);

    // CREATE vendor
    vendorRouter.post('/add-vendor', async (req, res) => {
        try {
            const vendorData = req.body;
            const response = await vendorService.create(vendorData);

            return res.status(response.code || 201).json({
                success: response.success,
                message: response.success ? 'Vendor sign up successfully' : response.error,
                data: response.data || null
            });

        } catch (e) {
            console.error('Error creating vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
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
