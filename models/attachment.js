const mongoose = require("mongoose");

const Attachment = new mongoose.Schema({
    filename:{
        type: String,
        default: ''
    },
    mimetype: {
        type: String,
        default: null
    },
    originalname:{
        type: String,
        default: ''
    },
    encoding:{
        type: String,
        default: ''
    },
    destination:{
        type: String,
        default: ''
    },
    path:{
        type: String,
        default: ''
    },
    size:{
        type: String,
        default: ''
    },

    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('attachment', Attachment);