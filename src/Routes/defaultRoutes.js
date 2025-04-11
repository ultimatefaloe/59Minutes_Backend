import express from 'express';

export const defaultRoutes = (router) => {
    const defaultRouter = express.Router();

    router.use('/', defaultRouter);

    defaultRouter.all('/auth', (req, res, next)=>{
        res.status(405).json({
            code: 405,
            msg: `${req.method} is not allow for route ${req.url}`
        })
    });

    defaultRouter.all('/product', (req, res, next)=>{
        res.status(405).json({
            code: 405,
            msg: `${req.method} is not allow for route ${req.url}`
        })
    });
    
    defaultRouter.all('/order', (req, res, next)=>{
        res.status(405).json({
            code: 405,
            msg: `${req.method} is not allow for route ${req.url}`
        })
    });

    defaultRouter.all('*', (req, res)=>{
        res.status(404).json({
            code: 404,
            msg: `${req.url} is not found`
        })
    })


}