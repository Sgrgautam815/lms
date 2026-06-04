const mongoose = require("mongoose");

// ==========================================
// MARK SCHEMA
// ==========================================

const markSchema = new mongoose.Schema({

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

    marksObtained: {
        type: Number,
        required: true
    },

    totalMarks: {
        type: Number,
        required: true
    }

},

    {
        timestamps: true
    });

module.exports =
    mongoose.model(
        "Mark",
        markSchema
    );
