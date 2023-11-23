var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var config = require("../../config");

var KycRequestModel = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    document:
    {
        docType: {
            type: String,
            enum: ['aadhar', 'pan'],
            default: "",
        },
        front: {
            type: String,
            required: true,
            default: "",
        },
        rear: {
            type: String,
            default: "",
        },
        number: {
            type: String,
            required: true,
            default: "",
        },
    },

    self_image: {
        type: String,
        required: true,
        default: "",
    },
    name: {
        type: String,
        required: true,
        default: "",
    },
    status: {
        type: String,
        enum: ["verified", "unverified", "rejected", "pending"],
        default: "pending"
    },
    reason:{
        type: String,
        default:"",
    },
    created_at: {
        type: Number,
    },

    created_date: {
        type: Date,
        default: Date.now()
    },

    updated_date: {
        type: Date,
        default: Date.now()
    },

});
var KycRequest = mongoose.model('KycRequest', KycRequestModel);

module.exports = { KycRequest };
