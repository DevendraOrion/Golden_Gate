const mongoose = require('mongoose');

const gameRecordSchema = new mongoose.Schema({
  spot: { type: String, required: true },
  winNo: { type: String },
  room_id: { type: String },
  game_id: { type: String },
});

const GameRecord = mongoose.model('GameRecord', gameRecordSchema);

module.exports = GameRecord;