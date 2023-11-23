var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AccessLogModel = new Schema({
    admin: {
        type: Schema.Types.ObjectId,
        required: true
    },
    action: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId
    },
    distributor: {
        type: Schema.Types.ObjectId
    },
    created_at:{
        type: Number
    }
});

var AccessLog = mongoose.model('AccessLog', AccessLogModel);

module.exports = {
    AccessLog
};