import express from 'express';
import config from '../config/config.js';
import { defaultRoutes } from './default.routes.js';
import { userRoutes } from '../User/user.routes.js';
import { productRoutes } from '../Product/product.routes.js';
import { vendorRoutes } from '../Vendor/vendor.routes.js';
import { categoryRoutes } from '../Category/category.routes.js';
import authRoutes from '../Auth/auth.routes.js';

export default () => {
    const router = express.Router();

    authRoutes(router);

    if (config.switch.cat){
        categoryRoutes(router)
    };

    if (config.switch.user){
        userRoutes(router)
    };

    if(config.switch.product){
        productRoutes(router)
    };

    if(config.switch.vendor){
        vendorRoutes(router)
    };

    if (config.switch.default){
        defaultRoutes(router);
    };

    return router;
}