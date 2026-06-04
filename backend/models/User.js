const mongoose = require("mongoose");

// ==========================================
// USER SCHEMA
// ==========================================

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    collegeId: {
        type: String,
        required: true,
        unique: true
    },

    course: {
        type: String,
        required: true
    },

    section: {
        type: String,
        default: "A"
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

    address: {
        type: String
    },

    role: {
        type: String,
        default: "student"
    },

    subjects: {
        type: [String],
        default: []
    },

    isVerified: {
        type: Boolean,
        default: false
    }

},

    {
        timestamps: true
    });

module.exports =
    mongoose.model(
        "User",
        userSchema
    );