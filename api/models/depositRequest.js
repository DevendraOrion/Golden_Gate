var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var DepositRequest = new Schema({
  fromUser: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
},
toUser: {
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
    type: Number,
    // default: ""
},
showDate: {
    type: String,
    default:Date.now
},
created_at: {
    type: String,
    default:Date.now
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
    enum: ['G', 'P', 'A', 'B', 'R', 'O', 'REF', 'S','GIFT',"D"] //G = Game, P = Paytm, A = By Admin,  B = Bonus, R = Refund, REF = Referral, O =  Other, S='Scratch Card'
},
payment_mode: {
    type: String,
    // enum: Object.values(config.payment_modes),
    // default: config.payment_modes.PA
    // PA = Paytm_Old , OTHERS
},
is_status: {
    type: String,
    enum: ['P', 'S', 'F', 'C', 'FL'], // P = Pending, S = Success, F = Failed, C = Canceled, FL = Flagged suspecious
    default: 'S'
},

});

var DepositRequests = mongoose.model("DepositRequests", DepositRequest);

module.exports = {
  DepositRequests,
};
