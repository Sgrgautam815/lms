const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({

    title: {

        type: String,
        required: true

    },

    course: {

        type: String,
        required: true

    },

    deadline: {

        type: String,
        required: true

    }

}, {

    timestamps: true

});

module.exports = mongoose.model(
    "Assignment",
    assignmentSchema
);