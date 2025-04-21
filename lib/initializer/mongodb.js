import mongoose from "mongoose";

export const mongoSetup = async ({ mongo }) => {
    const { encodedPassword, encodedUsername } = mongo;

    const connection_uri = `mongodb+srv://${encodedUsername}:${encodedPassword}@cluster0.ftix1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

    try {
        await mongoose.connect(connection_uri);
        console.log("✅ DB connection successful!");
    } catch (error) {
        console.error("❌ DB connection error:", error);
        throw new Error(error);
    }
};