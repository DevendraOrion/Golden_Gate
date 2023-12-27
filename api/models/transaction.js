var mongoose = require("mongoose"),
  Schema = mongoose.Schema;
const config = require("./../../config");

var TransactionModel = new Schema({
  user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
  },
  txn_amount: {
      type: Number,
      required: true,
      default: 0
  },
  current_balance: {
      type: Number,
      required: true,
      default: 0
  },
  txn_id: {
      type: String,
      default: ""
  },
  created_at: {
      type: String
  },
  transaction_type: {
      type: String,
      enum: ['C', 'D'], // C = Credit, D = Debit
      default: "C"
  },
  resp_msg: {
      type: String,
      default: ""
  },
  txn_mode: {
      type: String,
      enum: ['G', 'P', 'A', 'B', 'R', 'O', 'REF', 'S','GIFT'] //G = Game, P = Paytm, A = By Admin,  B = Bonus, R = Refund, REF = Referral, O =  Other, S='Scratch Card'
  },
  payment_mode: {
      type: String,
      enum: Object.values(config.payment_modes),
      default: config.payment_modes.PA
      // PA = Paytm_Old , OTHERS
  },
  is_status: {
      type: String,
      enum: ['P', 'S', 'F', 'C', 'FL'], // P = Pending, S = Success, F = Failed, C = Canceled, FL = Flagged suspecious
      default: 'S'
  },
  frame_id: {
      type: String
  },
  spinWinNo: {
      type: Number
  }
});
TransactionModel.pre("save", function (next) {
  var self = this;
  mongoose.models["Transaction"].findOne(
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
var Transaction = mongoose.model("Transaction", TransactionModel);

module.exports = {
  Transaction,
};
