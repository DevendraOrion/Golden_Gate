var mongoose = require("mongoose"),
  Schema = mongoose.Schema;
var NotificationModel = new Schema({
  notice_title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  content: {
    type: String,  
  },
  notice_date: {
    type: String,  
  },
  created_at:{
    type: Date,
    default: Date.now,

  }
});
var Notification = mongoose.model("Notification", NotificationModel);
module.exports = {
  Notification,
};
