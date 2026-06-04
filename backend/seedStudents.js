require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");

async function seedStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const students = [
            { name: "Rahul Sharma", rollNumber: "CS101", course: "Computer Science" },
            { name: "Priya Patel", rollNumber: "CS102", course: "Computer Science" },
            { name: "Amit Kumar", rollNumber: "ME201", course: "Mechanical Engineering" },
            { name: "Sneha Reddy", rollNumber: "EE301", course: "Electrical Engineering" },
            { name: "Vikram Singh", rollNumber: "CS103", course: "Computer Science" },
            { name: "Ananya Iyer", rollNumber: "EC401", course: "Electronics" },
            { name: "Arjun Gupta", rollNumber: "ME202", course: "Mechanical Engineering" },
            { name: "Kavita Rao", rollNumber: "CS104", course: "Computer Science" },
            { name: "Siddharth Jain", rollNumber: "CE501", course: "Civil Engineering" },
            { name: "Megha Verma", rollNumber: "EE302", course: "Electrical Engineering" }
        ];

        await Student.deleteMany({}); // Optional: clear existing students first
        const savedStudents = await Student.insertMany(students);
        console.log(`Successfully added ${savedStudents.length} students!`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedStudents();
