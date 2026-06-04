const mongoose = require("mongoose");


const fileSchema = new mongoose.Schema({

    fileName: {

        type: String,

        required: true

    },

    fileUrl: {

        type: String,

        required: true

    }

}, {

    timestamps: true

});

module.exports = mongoose.model(
    "File",
    fileSchema
);