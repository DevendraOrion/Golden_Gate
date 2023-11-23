var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var AgentModel = new Schema({
    distributor_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
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
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        trim: true
    },
    referral_code: {
        type: String,
        trim: true,
        unique: true
    },
    commission_wallet: {
        type: Number 
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
    role:{
        type: String,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true,
        trim: true
    },
    is_deleted: {
        type: Boolean,
        default: false,
    },
    created_at:{
        type: String
    }
}, {
    usePushEach: true
});

module.exports = mongoose.model('Agent', AgentModel);