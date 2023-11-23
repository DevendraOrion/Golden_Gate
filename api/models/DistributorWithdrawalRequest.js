var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var DistributorWithdrawalModel = new Schema({
  distributor_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Distributor",
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
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
    enum: ["paytm", "bank", "upi"], // P = Paytm, B = Bank Transfer,U=upi
    default: "bank",
  },
  mobile_no: {
    type: String,
    maxlength: 12,
  },
  upi_id: {
    type: String,
  },
  created_at: {
    type: String,
  },
  completed_at: {
    type: String,
  },
  is_status: {
    type: String,
    enum: ["P", "A", "R"], // P = Pending, A = Accept, R = Reject
    default: "P",
  },
});

var DistributorWithdrawalRequest = mongoose.model(
  "DistributorWithdrawalRequest",
  DistributorWithdrawalModel
);

module.exports = { DistributorWithdrawalRequest };
