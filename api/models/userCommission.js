var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var config = require('./../../config');

var UserCommission = new Schema({
    type: {
        type: String,
        // required: true
    },
    parent:{
        type:String,
    },
    user:{
        type:String,
    },
    CarRoullete: {
        type: Number,
        default:0
    },
    Avaitor:{
        type: Number,
        default:0
    },
    Roullete:{
        type: Number,
        default:0
    },
   
});


module.exports = mongoose.model('UserCommission', UserCommission);