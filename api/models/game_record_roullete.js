const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const game_record_roulette = new Schema({
    spots: { type: String},
    room_id: { type: String, required: true },
    game_id: { type: Number, required: true },
    created_at: { type: Date, default: Date.now }
});

const Roulette_record = mongoose.model('game_record_roulette', game_record_roulette);
module.exports = Roulette_record;
