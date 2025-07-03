import express from 'express';
import categoryService from './categoryService.js';
import Middleware from '../Middleware/middleware.js';
import { resolveCategoryId } from '../utils/resolveCategoryId.js';

const categoryRouter = express.Router();

export const categoryRoutes = (router) => {

    router.use('/categories', categoryRouter);

    // Create category
    categoryRouter.post('/add-category', Middleware.decodeJWTToken(), async (req, res) => {
        const result = await categoryService.create(req.body);
        return res.status(result.code || (result.success ? 201 : 400)).json(result);
    });

    // Get all categories
    categoryRouter.get('/', async (req, res) => {
        const result = await categoryService.list();
        return res.status(result.code || 200).json(result);
    });

    // Get product that belong to a categories
    categoryRouter.get('/:identifier', async (req, res) => {
        try {
          const { identifier } = req.params;
          const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
          
          // Parse sorting parameters
          const [sortField, sortDirection] = sort.startsWith('-') 
            ? [sort.substring(1), -1] 
            : [sort, 1];
                

          const resolvedCategoryId = await resolveCategoryId(identifier);
          
          if (!resolvedCategoryId) {
            return res.status(404).json({
              success: false,
              message: `Category '${identifier}' not found`,
              data: []
            });
          }
          
          const categoryProducts = await categoryService.getById(resolvedCategoryId, {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sortField,
            sortOrder: sortDirection
          });
          
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
    categoryRouter.patch('/update/:id', Middleware.decodeJWTToken(), async (req, res) => {
        const result = await categoryService.update(req.params.id, req.body);
        return res.status(result.code || 200).json(result);
    });

    // Delete category
    categoryRouter.delete('/:id', Middleware.decodeJWTToken(), async (req, res) => {
        const result = await categoryService.delete(req.params.id);
        return res.status(result.code || 200).json(result);
    });

}
