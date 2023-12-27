var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var config = require('./../../config');

var SuperAdminModel = new Schema({
    name: {
        type: String,
        required: true
    },
    parent:{
type:String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String
    },
    is_active:{
        type: Boolean,
        default: true
    },
    max_commission: {
        type: Number,
        default:0
    },
    min_commission: {
        type: Number,
        default:0
    },
    is_deleted:{
        type: Boolean,
        default: false
    },
    role:{
        type: String,
        enum:Object.keys(config.ADMIN_ROLES)
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
    created_at:{
        type: Number
    }
}, {
    usePushEach: true
});


module.exports = mongoose.model('SuperAdmin', SuperAdminModel);