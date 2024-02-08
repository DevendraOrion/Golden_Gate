const mongoose = require('mongoose')
const { Schema } = require('mongoose');
// Define the MongoDB schema for the game_result table
const joinGame = new Schema({
  user_id: { type: String, required: true },
  room_id: { type: String, required: true },
  spot: { type: String },
  win_amount: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  game_id: { type: String, required: true },
  created: { type: Date, default: Date.now },
  is_updated: { type: String, default: '0' }
});

// Export the MongoDB model
const Join_game = mongoose.model('join_game', joinGame);
module.exports = Join_game;
