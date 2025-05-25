import mongoose from "mongoose";

export const mongoSetup = async ({ mongo }) => {
    
    const { DB_USERNAME, DB_PASSWORD} = mongo

    const connection_uri = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.ftix1.mongodb.net/59MinutesPrints?retryWrites=true&w=majority&appName=Cluster0`;
    console.log(connection_uri)
    try {
        await mongoose.connect(connection_uri);
        console.log("✅ DB connection successful!");
    } catch (error) {
        console.error("❌ DB connection error:", error);
        throw new Error(error);
    }
};