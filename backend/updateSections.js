require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Student = require("./models/Student");

async function updateSections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const userResult = await User.updateMany({ section: { $exists: false } }, { $set: { section: "A" } });
        console.log(`Updated ${userResult.modifiedCount} users with default section 'A'.`);

        const studentResult = await Student.updateMany({ section: { $exists: false } }, { $set: { section: "A" } });
        console.log(`Updated ${studentResult.modifiedCount} students with default section 'A'.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateSections();
