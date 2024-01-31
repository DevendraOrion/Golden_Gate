var mongoose = require("mongoose"),
  Schema = mongoose.Schema;
var ProfitPercentMgt = new Schema({
    
  gameType: {
    type: String,
    required: true,
  },
  gamePercent: {
    type: Number,  
    default: 0
  },
  
});
var ProfitPercent = mongoose.model("ProfitPercent", ProfitPercentMgt);
module.exports = {
    ProfitPercent,
};
