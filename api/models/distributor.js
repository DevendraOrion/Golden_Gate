var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DistributorModel = new Schema({
    name: {
        type: String,
        required: true
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
    is_deleted:{
        type: Boolean,
        default: false
    },
    role:{
        type: String,
        required: true
    },
    admin_id: {
        type: Schema.Types.ObjectId
    },
    commission_wallet: {
        type: Number
    },
    profile_picture: {
        type: String,
        trim: true
    },
    mobile_no: {
        country_code: {
            type: String,
            trim: true
        },
        number: {
            type: String,
            trim: true
        }
    },
	tokens: [{
		access: {
			type: String
		},
		token: {
			type: String
        },
        password_reset: {
            type: String,
			required: false
        }
    }],
    created_at:{
        type: Number
    }
}, {
    usePushEach: true
});

module.exports = mongoose.model('Distributor', DistributorModel);