var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const config = require("./../../config");
var UserModel = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  last_name: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  numeric_id: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
  },
  mobile_no: {
    country_code: {
      type: String,
    },
    number: {
      type: String,
      trim: true,
    },
  },
  profilepic: {
    type: String,
    trim: true,
  },
  avatar: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    default: 0,
  },
  referral: {
    referral_code: String,
    referred_by: String,
    amount: {
      type: Number,
      default: 0,
    },
    matches: {
      type: Number,
      default: 0,
    },
    first_ref: {
      type: Boolean,
      default: false,
    },
  },
  created_at: {
    type: String,
  },
  last_login: {
    type: String,
  },
  main_wallet: {
    type: Number,
    default: config.signup_bonus,
  },
  win_wallet: {
    type: Number,
    default: 0,
  },
  app_version: {
    type: String,
  },
  facebook_id: {
    type: String,
    default: "",
  },
  google_id: {
    type: String,
    default: ''
},
  device_id: {
    type: String,
    trim: true,
  },
  device_type: {
    type: String,
    enum: ["ios", "android"],
  },
  otp: {
    value: {
      type: String,
    },
    send_attempts: {
      type: Number,
      default: 0,
    },
    continuous_false_attempts: {
      type: Number,
      default: 0,
    },
    expired_at: {
      type: String,
    },
  },
  otp_verified: {
    type: Boolean,
    default: false,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  email_token: {
    value: {
      type: String,
    },
    expired_at: {
      type: String,
    },
  },
  reset_token: {
    value: {
      type: String,
    },
    expired_at: {
      type: String,
    },
  },
  password: {
    type: String,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  onesignal_id: {
    type: String,
    default: "",
  },
  push_enable: {
    type: Boolean,
    default: true,
  },
  ref_bonus_passed: {
    type: Boolean,
    default: false,
  },
  user_device: {
    name: {
      type: String,
    },
    model: {
      type: String,
    },
    os: {
      type: String,
    },
    processor: {
      type: String,
    },
    ram: {
      type: String,
    },
  },
  tokens: [
    {
      access: {
        type: String,
        required: true,
      },
      token: {
        type: String,
        required: true,
      },
    },
  ],
  kyc_verified: {
    status: {
      type: String,
      enum: ["verified", "unverified", "rejected", "pending"],
      default: "unverified",
    },
    reason: {
      type: String,
      default: "",
    },
  },
  is_google_sign_in: {
    type: Boolean,
  }
});

var User = mongoose.model("User", UserModel);

module.exports = {
  User,
};
