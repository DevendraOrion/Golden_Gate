var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var ReferralModel = new Schema({
    referred_by: {
        type: String,
        required: true
    },
    referred_to: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    room_code:{
        type: String,
        default: ""
    },
    created_at: {
        type: String
    }
});

var Referral = mongoose.model('Referral', ReferralModel);

module.exports = {
    Referral
};