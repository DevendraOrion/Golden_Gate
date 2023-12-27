var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var JoinGameModel = new Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'Users'
    },
    room_id: {
        type: String,
        required: true
    },
    game_id: {
        type: Number,
        required: true
    },
    spot: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    win_amount: {
        type: Number,
        default: 0
    },
    is_updated: {
        type: Number,
        default: 0,
        enum: [0, 1]
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
})
var JoinGame = mongoose.model('JoinGame', JoinGameModel);

module.exports = {JoinGame};
