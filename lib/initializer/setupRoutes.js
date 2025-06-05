import express from 'express';
import cors from 'cors';
import multer from 'multer';
import routes from "../../Routes/routes.js";
import config from "../../config/config.js";

export const setupRoutes = (app) => {
    const router = routes();

    app.use(cors());

    // For JSON bodies
    app.use(express.json());

    // For urlencoded form bodies
    app.use(express.urlencoded({ extended: true }));

    // Do NOT use express.raw for multipart/form-data!
    // Use multer in your route files as needed, e.g.:
    // const upload = multer();
    // router.post('/upload', upload.single('file'), (req, res) => { ... });

    // For serving static files
    app.use(express.static('public'));
    app.use('/static', express.static('public'));
    app.use('/uploads', express.static('uploads'));
    app.use('/images', express.static('images'));
    app.use('/files', express.static('files'));

    app.use(config.api.routes, router);
};