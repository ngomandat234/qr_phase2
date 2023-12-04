const mongoose = require("mongoose");

const User = new mongoose.Schema({
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: ''
    },
    qrCode: {
        type: String,
        default: ''
    },
    avatar:{
        type: String,
        default: null,
    },
    group_user: {
        type: "String",
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    status:{
        type: Number,
        default: 1
    },
    trackings: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'qr_tracking'
    }],
    printings: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'qr_printer'
    }]
});

module.exports = mongoose.model('user', User);