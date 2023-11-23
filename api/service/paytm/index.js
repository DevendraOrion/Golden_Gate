var request = require('request');
const config = require('./../../../config');
const _ = require('lodash');
const localization = require('./../localization');
const {Transaction} = require('./../../models/transaction');
const {User} = require('./../../models/user');
const Service = require('./../index');

module.exports = {
    verify_transaction: function(order_id, checksum) {
        return new Promise(async (resolve, reject) => {
            console.log(order_id, checksum);
            var options = {
                method: 'POST',
                url: `${config.PAYTM.URL}${config.PAYTM.CHECK_TRANSACTION_STATUS}`,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    MID: config.PAYTM.MID,
                    ORDERID: order_id,
                    CHECKSUMHASH: checksum
                },
                json: true
            };

            var trans = await Transaction.findOne({'order_id':order_id});
            if(!trans)
                return reject('Verification check failed, please try again!');

            request(options, async function(error, response, body) {
                if (error) {
                    console.log('Verification check failed', error);
                    return reject('Verification check failed, please try again!');
                }

                if (body.STATUS) {
                    if (body.STATUS == 'TXN_SUCCESS') {
                        // CHECK IF USER VALID
                        if (!Service.validateObjectId(trans.user_id))
                            return reject(localization.ServerError);
    
                        // UPDATE TRANSACTION STATUS
                        let transUpdated = await Transaction.findByIdAndUpdate(trans._id, {
                            $set: {
                                is_status: 'S'
                            }
                        });
                        if (!transUpdated) 
                        return reject(localization.ServerError);
    
                        let userUpdated = await User.findByIdAndUpdate(trans.user_id, {
                            $inc: { main_wallet: trans.txn_amount }
                        });
                        if (!userUpdated) {
                            await Transaction.findByIdAndUpdate(trans._id, {
                                $set: {
                                    is_status: 'P'
                                }
                            });
                            return reject(localization.ServerError);
                        }
                        // ADD MONEY TO USER MAIN WALLET
                        return resolve({status:1,message:localization.success});
                    } else if (body.STATUS == 'PENDING') {
                        return resolve({status:2,message:body.RESPMSG || localization.TransPending});
                    } else {
                        // UPDATE TRANSACTION STATUS FAILURE
                        await Transaction.findByIdAndUpdate(trans._id, {
                            $set: {
                                is_status: 'F'
                            }
                        });
                        return reject(body.RESPMSG || localization.TransFailed);
                    }
                } else {
                    // SEND ERROR
                    return reject(localization.ServerError);
                }
            });
        });
    }
};
