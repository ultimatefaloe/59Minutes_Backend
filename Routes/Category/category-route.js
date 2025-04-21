import express from 'express';
import categoryService from '../../Service/category/categoryService.js';
import Middleware from '../../Middleware/middleware.js';
import { resolveCategoryId } from '../../utils/resolveCategoryId.js';

const categoryRouter = express.Router();

export const categoryRoute = (router) => {

    router.use('/category', categoryRouter);

    // Create category
    categoryRouter.post('/add-category', Middleware.jwtDecodeToken(), async (req, res) => {
        const result = await categoryService.create(req.body);
        return res.status(result.code || (result.success ? 201 : 400)).json(result);
    });

    // Get all categories
    categoryRouter.get('/', async (req, res) => {
        const result = await categoryService.list();
        return res.status(result.code || 200).json(result);
    });

    // Get Product by category ID
    categoryRouter.get('/products/:name', async (req, res) => {
        try {
            const categoryNameOrId = req.params.name;
    
            const resolvedCategoryId = await resolveCategoryId(categoryNameOrId);
    
            if (!resolvedCategoryId) {
                return res.status(400).json({
                    success: false,
                    message: `Category '${categoryNameOrId}' not found`,
                });
            }
    
            const categoryProducts = await categoryService.getById(resolvedCategoryId);
    
            return res.status(categoryProducts.code || 200).json(categoryProducts);
    
        } catch (error) {
            console.error('Error getting category products:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    });

    // Update category
    categoryRouter.patch('/:id', Middleware.authRequired(), async (req, res) => {
        const result = await categoryService.update(req.params.id, req.body);
        return res.status(result.code || 200).json(result);
    });

    // Delete category
    categoryRouter.delete('/:id', Middleware.authRequired(), async (req, res) => {
        const result = await categoryService.delete(req.params.id);
        return res.status(result.code || 200).json(result);
    });

}
