import express from 'express';
import config from './config.js';
import { initializeApp } from './initializer/initializeApp.js';
import dotenv from 'dotenv';

dotenv.config();

export const startServer = () => {
    const app = express();
    const port = config.port;

    app.use(express.json());

    initializeApp(app, config);

    try{
        app.listen(port, ()=>{
            console.log(`App listening to port: ${port}`)
            console.log(`localhost:${port}`)
        })
    } catch(err) {
        throw new Error(err)
    };
}