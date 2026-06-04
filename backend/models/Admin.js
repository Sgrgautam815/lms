const mongoose = require("mongoose");

// ==========================================
// ADMIN SCHEMA
// ==========================================

const adminSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: "admin",
        immutable: true  // Cannot be changed after creation
    },

    isSuperAdmin: {
        type: Boolean,
        default: false
    },

    lastLogin: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);
