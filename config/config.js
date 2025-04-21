export default {
    port: process.env.PORT || 4000,

    api: {
        routes: `/api`,
    },

    switch: {
        default: true,
        cat: true,
        user: true,
        product: true,
        vendor: true,
    },

    mongo: {
        encodedusername: process.env.DB_USERNAME,
        encodedpassword: process.env.DB_PASSWORD
    }
}