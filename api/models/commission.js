var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var config = require('./../../config');

var Commission = new Schema({
    gameType: {
        type: String,
        required: true
    },
    rankId:{
        type:String,
    },
    rankName:{
        type:String,
    },
    userId:{
        type:String,
    },
    availableCommission: {
        type: Number,
        // default:0
    },
    downline:{
        type: Number,
        // default:0
    },
    ownCommission:{
        type: Number,
        // default:0
    },
    minCommission:{
        type: Number,
        // default:0
    },
   
});


module.exports = mongoose.model('Commission', Commission);