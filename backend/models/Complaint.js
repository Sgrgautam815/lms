const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        required: true,
        enum: ["student", "teacher"]
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "resolved"],
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
