import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default {
    port: process.env.PORT,

    api: {
        routes: `/api/v1`,
    },

    switch: {
        default: true,
        cat: true,
        user: true,
        product: true,
        vendor: true,
        order: true
    },

    mongo: {
       MONGO_DB_URI: process.env.MONGO_DB_URI,
    },

    mail: {
        SMTP_HOST: process.env.SMTP_HOST ,
        SMTP_PORT: process.env.SMTP_PORT ,
        FROM_EMAIL: process.env.FROM_EMAIL ,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS ,
        SMTP_SECURE: process.env.SMTP_SECURE ,
    },

    jwt: {
        JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY
    },

    cloudinary: {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
    },

    env: {
        NODE_ENV: process.env.NODE_ENV
    }
};
