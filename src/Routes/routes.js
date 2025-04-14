import express from 'express';
import config from '../config/config.js';
import { defaultRoutes } from './defaultRoutes.js';
import { userRoutes } from './UserRoutes/userRoute.js';
import { productRoute } from './ProductRoutes/product-route.js';
import { vendorRoute } from './VendorRoutes/vendor-route.js';

export default () => {
    const router = express.Router();

    if (config.switch.user){
        userRoutes(router)
    };

    if(config.switch.product){
        productRoute(router)
    };

    if(config.switch.vendor){
        vendorRoute(router)
    };

    if (config.switch.default){
        defaultRoutes(router);
    };

    return router;
}