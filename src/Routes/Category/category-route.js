import express from 'express';
import categoryService from '../../Service/category/categoryService.js';
import Middleware from '../../Middleware/auth-require.js';

const categoryRouter = express.Router();

export const categoryRoute = (router) => {

    router.use('/category', categoryRouter);

    // Create category
    categoryRouter.post('/add-category', Middleware.authRequired(), async (req, res) => {
        const result = await categoryService.create(req.body);
        return res.status(result.code || (result.success ? 201 : 400)).json(result);
    });

    // Get all categories
    categoryRouter.get('/', async (req, res) => {
        const result = await categoryService.list();
        return res.status(result.code || 200).json(result);
    });

    // Get category by ID
    categoryRouter.get('/:id', async (req, res) => {
        const result = await categoryService.getById(req.params.id);
        return res.status(result.code || 200).json(result);
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
