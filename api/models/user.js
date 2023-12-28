var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const config = require("./../../config");
var UserModel = new Schema({
  name: {
      type: String,
      trim: true,
      default: ''
  },
  email: {
      type: String,
      // trim: true,
      default: ''
  },
  profile_pic: {
      type: String,
      default: ''
  },
  avatar: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      default: 1
  },
  numeric_id: {
      type: Number,
      required: true,
  },
  is_guest: {
      type: Boolean,
      default: false
  },
  is_active: {
      type: Boolean,
      default: true
  },
  is_deleted: {
      type: Boolean,
      default: false
  },
  device_id: {
      type: String,
      // trim: true
  },
  device_type: {
      type: String,
      enum: ['ios', 'android'],
      default: 'android'
  },
  user_device: {
      name: {
          type: String
      },
      model: {
          type: String
      },
      os: {
          type: String
      },
      processor: {
          type: String
      },
      ram: {
          type: String
      }
  },
  level: {
      type: Number,
      default: 1
  },
  tokens: {
      access: {
          type: String,
          default: ''
      },
      token: {
          type: String,
          default: ''
      }
  },
  nickname: {
      default: '',
      type: String
  },
  gender: {
      type: String,
      enum: ["male", "female", "others"]
  },
  user_xp: {
      default: 0,
      type: Number
  },
  balance: {
      default: 0,
      type: Number
  },
  win_wallet: {
      default: 0,
      type: Number
  },
  referral_code: {
      type: String,
  },
  referral_by: {
      type: String,
      default: ""
  },
  language: {
      type: String,
      enum: ["Hindi", "English", "Bangla", "Urdu"],
      default: "English"
  },
  recive_request: {
      type: Boolean,
      default: false
  },
  created_at: {
      type: Date,
      default: Date.now
  },
  updated_at: {
      type: Date,
      default: Date.now
  },
  friends: [{
      type: String,
      ref: 'User',
      default: []
  }],
  blocked_user: [{
      type: String,
      ref: 'User',
      default: []
  }],
  frames: [{
      type: String,
      // ref: 'User',
      default: []
  }],
  dailyLogin: {
      type: Number,
      default: 0           //0 = not loged , 1 = loged
  },
  gamecount: {
      type: Number,
      default: 0
  },
  cards: [{
      cardnumber: {
          type: Number
      },
      cardtype: {
          type: Number
      },
      show: {
          type: Boolean,
          default: false
      },
      created: {
          type: String,
          // default: Date.now()
      },
      status: {
          type: Boolean,
          default: false
      },
      user_id: {
          type: String,
          ref: "User",
          default: ""
      }
  }]
  , likes: {
      type: Number,
      default: 0
  }
  , role: {
      type: String,
      default: "User"
  }
  , parent: {
      type: String,
    //   default: 0
  }
  , password: {
      type: String,
    //   default: 0
  },
  tokens: [{
    access: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
}],
})


var User = mongoose.model("User", UserModel);

module.exports = {
  User,
};
