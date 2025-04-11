export default {
    port: process.env.PORT || 3000,

    api: {
        routes: `/api`,
    },

    switch: {
        default: true,
        user: true,
    },

    mongo: {
        connection_string: `mongodb://localhost:27017/?authMechanism=DEFAULT`
    }
}