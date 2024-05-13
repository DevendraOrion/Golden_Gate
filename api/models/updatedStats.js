var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var updateStatsModel = new Schema({
    role: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    total_play_point: {
        type: String,
        default: 0
    },
    total_win_point: {
        type: String,
        default: 0
    },
    total_end_point: {
        type: String,
        default: 0
    },
    total_margin: {
        type: String,
        default: 0
    },
    total_net_margin: {
        type: String,
        default: 0
    },
    status: {
        type: Boolean,
        default: false
    },
    search_id: {
        type: String,
       
    },
    created_at: {
        type: String
    }
});

var Updated_stats = mongoose.model('UpdatedStats', updateStatsModel);

module.exports = {
    Updated_stats
};