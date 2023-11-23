var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var DefaultModel = new Schema({
  // Existing fields
  key: {
    type: String,
    required: true,
  },
  note:{
    type: String,
    default: "",
  },
  undermaintenance: {
    type: String,
    enum: ["Y", "N"],
    default: "N",
  },
  value: {
    type: Number,
    default: 0,
  },
  entryFees: {
    type: String,
    default: "",
  },
  banner_url: {
    type: String,
    default: "",
  },
  banner_status: {
    type: String,
    enum: ["Y", "N"],
    default: "N",
  },
  first_level_refer_bonus: {
    type: Number,
    default: 0,
  },
  second_level_refer_bonus: {
    type: Number,
    default: 0,
  },
  cardbonus: {
    type: Number,
    default: 0,
  },
  commission: {
    type: Number,
    default: 0,
  },
  contact_number: {
    type: String,
    default: "",
  },
  support_link: {
    type: String,
    default: "",
  },
  facebook_link: {
    type: String,
    default: "",
  },
  youtube_link: {
    type: String,
    default: "",
  },
  telegram_link: {
    type: String,
    default: "",
  },
  instragram_link: {
    type: String,
    default: "",
  },
  // New fields
  minimumBalance: {
    type: Number,
    default: 0,
  },
  minimum_deposite_balance: {
    type: Number,
    default: 0,
  },
  maximum_deposite_balance: {
    type: Number,
    default: 999999999,
  },
  maximum_withdraw_amount: {
    type: Number,
    default: 999999999,
  },
  minimum_withdraw_amount: {
    type: Number,
    default: 0,
  },
  showOnlinePlayer: {
    type: Boolean,
    default: false,
  },
  twoPlayer: {
    type: Boolean,
    default: false,
  },
  fourPlayer: {
    type: Boolean,
    default: false,
  },
  privatePlayer: {
    type: Boolean,
    default: false,
  },
  welcomeBonus: {
    type: Number,
    default: 0,
  },
  withdrawCommission: {
    type: Number,
    default: 0,
  },
  upiSetting: {
    type: String,
    default: "",
  },
  fees: {
    2: {
      type: String,
    },
    4: {
      type: String,
    },
    PVT: {
      type: String,
    },
  },
  deposite_refer_bonus: {
    type: Number,
    default: 0,
  },
  refer_code_bonus:{
    type: Number,
    default: 0
  }
});

var Default = mongoose.model("Setting", DefaultModel);
module.exports = { Default };
