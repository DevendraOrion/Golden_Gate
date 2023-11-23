var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var config = require("../../config");

var BlogsModel = new Schema({
    admin_id:{
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        default: "",
    },
    slug: {
        type: String,
        required: true,
        default: "",
    },
    body: {
        type: String,
        required: true,
        default: "",
    },    
    image: {
        type: String,
        required: true,
        default: "",
    },
    is_published: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now()
    },

    updated_at: {
        type: Date,
        default: Date.now()
    },

});
var Blogs = mongoose.model('Blogs', BlogsModel);

module.exports = { Blogs };
