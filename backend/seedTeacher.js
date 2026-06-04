require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Teacher = require("./models/Teacher");

async function seedTeacher() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const email = "teacher@college.com";
        const password = "123456";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Remove from general User model to ensure the login falls back to the Teacher model
        await User.deleteOne({ email });

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            console.log("Teacher already exists. Updating details...");
            existingTeacher.password = hashedPassword;
            existingTeacher.assignedCourses = ["Computer Science", "BTECH CSE"];
            existingTeacher.assignedSubjects = ["DBMS", "Operating System", "Computer Networks"];
            await existingTeacher.save();
            console.log("Teacher account updated successfully in Teacher model!");
        } else {
            console.log("Creating new teacher account in Teacher model...");
            const newTeacher = new Teacher({
                name: "Prof. Smith",
                teacherId: "TEACH-101",
                email: email,
                password: hashedPassword,
                phone: "1112223333",
                department: "Computer Science",
                assignedCourses: ["Computer Science", "BTECH CSE"],
                assignedSubjects: ["DBMS", "Operating System", "Computer Networks"],
                role: "teacher"
            });
            await newTeacher.save();
            console.log("Teacher account created successfully in Teacher model!");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedTeacher();
