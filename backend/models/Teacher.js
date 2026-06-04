const mongoose = require("mongoose");

// ==========================================
// TEACHER SCHEMA
// ==========================================

const teacherSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    teacherId: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    phone: {
        type: String
    },

    department: {
        type: String,
        required: true
    },

    qualification: {
        type: String,
        default: ""
    },

    experience: {
        type: String,
        default: ""
    },

    // Courses this teacher is authorized to teach
    assignedCourses: {
        type: [String],
        default: []
    },

    // Subjects this teacher is authorized to teach
    assignedSubjects: {
        type: [String],
        default: []
    },

    role: {
        type: String,
        default: "teacher"
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Teacher", teacherSchema);
