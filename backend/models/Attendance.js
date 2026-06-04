const mongoose = require("mongoose");

// ==========================================
// ATTENDANCE SCHEMA
// ==========================================

const attendanceSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true
    },
    rollNumber: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    },
    presentClasses: {
        type: Number,
        default: 0
    },
    totalClasses: {
        type: Number,
        default: 0
    },
    attendancePercentage: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["Present", "Absent"],
        default: "Present"
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Attendance", attendanceSchema);