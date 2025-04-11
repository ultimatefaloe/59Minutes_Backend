import routes from "../../Routes/routes.js";
import config from "../config.js";

export const setupRoutes = (app) => {

    const router = routes()
    
    app.use(config.api.routes, router)

}