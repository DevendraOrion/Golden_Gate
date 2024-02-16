const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const game_record_aviator = new Schema({
    distance: { type: String, required: true},
    total_amount: { type: String, required: true },
    admin_commission: { type: String, required: true },
    room_id: { type: String, required: true },
    game_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const Game_record_aviator = mongoose.model('game_record_aviator', game_record_aviator);
module.exports = Game_record_aviator;
