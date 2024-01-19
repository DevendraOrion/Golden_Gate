var mongoose = require("mongoose"),
  Schema = mongoose.Schema;
var RankData = new Schema({
    parentId: {
    type: String,
    // required: true,
  },
    rankId: {
    type: String,
    required: true,
  },
  rankName: {
    type: String,
    required: true,
  },
  rankTargetWeek: {
    type: Number,  
    default: 0
  },
  rankTargetMonth: {
    type: Number,  
    default: 0
  },
  rankJoining:{
    type: Number,  
    default: 0
  },
  created_at:{
    type: Date,
    default: Date.now,
  },
  updated_at:{
    type: Date,
    default: Date.now,
  }
});
var Rank_Data = mongoose.model("RankData", RankData);
module.exports = {
    Rank_Data,
};
