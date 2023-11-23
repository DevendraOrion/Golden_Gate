var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var config = require("../../config");

var BannersModel = new Schema({
  
    image: {
        type: String,
        required: true,
        default: "",
    },
    url: {
        type: String,
        default: ""
    },
    is_active: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Number
    },

    updated_at: {
        type: Number
    }

});
var Banners = mongoose.model('Banners', BannersModel);

module.exports = { Banners };
