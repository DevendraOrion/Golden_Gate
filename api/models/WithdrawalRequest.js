var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


var WithdrawalModel = new Schema({  
  request_id: {
    type: String,
    // required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  commission: {
    type: Number,
    required: true,
    default: 0
  },
  request_amount: {
    type: Number,
    required: true,
    default: 0
  },
  account_name: {
    type: String,
    trim: true,
  },
  account_no: {
    type: String,
  },
  bank_name: {
    type: String,
    trim: true,
  },
  ifsc_code: {
    type: String,
  },
  payment_type: {
    type: String,
    enum: ["paytm", "bank", "phonepe", "google_pay", "upi"], // P = Paytm, B = Bank Transfer, P = PhonePe, G = Google Pay
    default: "bank",
  },
  mobile_no: {
    type: String,
    maxlength: 12,
  },
  upi_id: {
    type: String
  },
  utr_id: {
    type: String
  },
  remark: {
    type: String,
    default:''
  },
  created_at: {
    type: String,
    default:''
  },
  completed_at: {
    type: String
  },
  is_status: {
    type: String,
    enum: ["P", "A", "R"], // P = Pending, A = Accept, R = Reject
    default: "P",
  }
});
WithdrawalModel.pre("save", function (next) {
  var self = this;
  mongoose.models["WithdrawalRequest"].findOne(
    { request_id: { $exists: true }},
    {},
    { sort: { created_at: -1 } },
    function (err, transaction) {
      if (err) {
        return next(err);
      }
      if (transaction) {
        if(transaction?.request_id){
          self.request_id = "0000" + (parseInt(transaction.request_id) + 1).toString();
        }else{
          self.request_id = "00001";
        }
      } else {
        self.request_id = "00001";
      }
      next();
    }
  );
});

var WithdrawalRequest = mongoose.model('WithdrawalRequest', WithdrawalModel);

module.exports = { WithdrawalRequest };