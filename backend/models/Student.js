const mongoose = require("mongoose");

// ==========================================
// STUDENT SCHEMA (For Protected CRUD)
// ==========================================
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Student name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"]
  },
  rollNumber: {
    type: String,
    required: [true, "Roll number is required"],
    unique: true
  },
  course: {
    type: String,
    required: [true, "Course name is required"],
    trim: true
  },
  section: {
    type: String,
    default: "A"
  },
  subjects: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Student", studentSchema);