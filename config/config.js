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
        encodedusername: process.env.DB_USERNAME || `troy19156@gmail.com`,
        encodedpassword: process.env.DB_PASSWORD || `Ultimate@25`
    }
}
