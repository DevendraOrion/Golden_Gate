var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
    var bcrypt = require("bcryptjs");
const config = require("./../../config");
var UserModel = new Schema({
    first_name: String,
    last_name: String,
    name: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        // trim: true,
        default: ''
    },
    profile_pic: {
        type: String,
        default: ''
    },

    numeric_id: {
        type: Number,
        required: true,
    },
    security_pin: {
        type: String,
        default: '1234',

    },
    search_id: {
        type: String,
        //   required: true,
    },
    phone: {
        type: Number,
        //   required: true,
    },
    is_guest: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    device_id: {
        type: String,
        // trim: true
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', '1'], default: 'ACTIVE' },
    address:{
        type: String,
        // default: true
    },
    district:{
        type: String,
        // default: true
    },
    block:{
        type: String,
        // default: true
    },
    postalCode:{
        type: String,
        // default: true
    },
    cash_balance: { type: Number, default: 0 },
    coin_balance: { type: Number, default: 0 },
    safe_balance: { type: Number, default: 0 },
    winning_balance: { type: Number, default: 0 },
    bonus_amount: { type: Number, default: 0 },
    device_type: {
        type: String,
        enum: ['ios', 'android'],
        default: 'android'
    },
    user_device: {
        name: {
            type: String
        },
        model: {
            type: String
        },
        os: {
            type: String
        },
        processor: {
            type: String
        },
        ram: {
            type: String
        }
    },
    level: {
        type: Number,
        default: 1
    },
    tokens: {
        access: {
            type: String,
            default: ''
        },
        token: {
            type: String,
            default: ''
        }
    },

    gender: {
        type: String,
        enum: ["male", "female", "others"]
    },
    user_xp: {
        default: 0,
        type: Number
    },
    balance: {
        default: 0,
        type: Number
    },
    win_wallet: {
        default: 0,
        type: Number
    },
    referral_code: {
        type: String,
    },
    referral_by: {
        type: String,
        default: ""
    },
    language: {
        type: String,
        enum: ["Hindi", "English", "Bangla", "Urdu"],
        default: "English"
    },
    recive_request: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
 
     role: {
        type: String,
        default: "User"
    }
    , parent: {
        type: String,
        //   default: 0
    }
    , password: {
        type: String,
        //   default: 0
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }],
})


var User = mongoose.model("User", UserModel);

module.exports = {
    User,
};
