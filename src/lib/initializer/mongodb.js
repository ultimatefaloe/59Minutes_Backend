import mongoose from "mongoose";

export const mongoSetup = async({ mongo }) => {
    

    const { connection_string } = mongo;

    try{
        await mongoose.connect(connection_string);
        console.log("DB connection successful!");
    } catch (error) {
        throw new Error(error);
    };

}