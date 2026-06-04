require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Student = require("./models/Student");
const Mark = require("./models/Mark");
const Attendance = require("./models/Attendance");

async function syncStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Find all users with role 'student'
        const studentUsers = await User.find({ role: "student" });
        console.log(`Found ${studentUsers.length} student users in User collection.`);

        let syncedCount = 0;
        let updatedCount = 0;
        let createdMarksCount = 0;
        let createdAttCount = 0;

        for (const user of studentUsers) {
            // Check if they already exist in the Student collection by rollNumber/collegeId
            let student = await Student.findOne({ rollNumber: user.collegeId });
            
            if (!student) {
                student = new Student({
                    name: user.name,
                    rollNumber: user.collegeId,
                    course: user.course,
                    section: user.section || "A",
                    subjects: user.subjects || []
                });
                await student.save();
                syncedCount++;
            } else {
                // Update subjects/section if they differ
                student.name = user.name;
                student.course = user.course;
                student.section = user.section || student.section || "A";
                student.subjects = user.subjects && user.subjects.length > 0 ? user.subjects : student.subjects;
                await student.save();
                updatedCount++;
            }

            // Sync Marks & Attendance records for student's subjects
            const subjects = student.subjects || [];
            for (const sub of subjects) {
                // Check if mark record exists
                const existingMark = await Mark.findOne({ rollNumber: student.rollNumber, course: sub });
                if (!existingMark) {
                    await new Mark({
                        studentName: student.name,
                        rollNumber: student.rollNumber,
                        course: sub,
                        marksObtained: 0,
                        totalMarks: 0
                    }).save();
                    createdMarksCount++;
                }

                // Check if attendance record exists
                const existingAtt = await Attendance.findOne({ rollNumber: student.rollNumber, course: sub });
                if (!existingAtt) {
                    await new Attendance({
                        studentName: student.name,
                        rollNumber: student.rollNumber,
                        course: sub,
                        presentClasses: 0,
                        totalClasses: 0,
                        attendancePercentage: 0
                    }).save();
                    createdAttCount++;
                }
            }
        }

        console.log(`Sync completed!`);
        console.log(`- Synced (new): ${syncedCount}`);
        console.log(`- Updated (existing): ${updatedCount}`);
        console.log(`- Initialized Marks records: ${createdMarksCount}`);
        console.log(`- Initialized Attendance records: ${createdAttCount}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

syncStudents();
