var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DistributorModel = new Schema({
    search_id: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNo:{
        type: Number
    },
    password:{
        type: String
    },
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
    parentId:{
        type: String,
        // default: true
    },
    parent:{
        type: String,
        default: false
    },
    securityPin:{
        type: String,
        default: false
    },
    // securityPin:{
    //     type: String,
    //     default: false
    // },

    created_at:{
        type: Number,
        default: Date.now
    }
}, {
    usePushEach: true
});

module.exports = mongoose.model('Distributor', DistributorModel);