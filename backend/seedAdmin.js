require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Admin = require("./models/Admin");

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const adminEmail = "admin@college.com";
        const password = "123456";
        const hashedPassword = await bcrypt.hash(password, 12);

        // Remove from general User collection to avoid duplication/confusion
        await User.deleteOne({ email: adminEmail });

        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("Admin already exists in Admin model. Updating password...");
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log("Admin account updated successfully in Admin model!");
        } else {
            console.log("Creating new admin account in Admin model...");
            const newAdmin = new Admin({
                name: "Admin User",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                isSuperAdmin: true
            });
            await newAdmin.save();
            console.log("Admin account created successfully in Admin model!");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedAdmin();
