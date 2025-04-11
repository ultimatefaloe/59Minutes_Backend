import { mongoSetup } from "./mongodb.js";
import { setupRoutes } from "./setupRoutes.js";

export const initializeApp = (app, config) => {

    mongoSetup(config);

    setupRoutes(app);

}