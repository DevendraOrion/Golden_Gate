var { User } = require("./../models/user"),
  config = require("./../../config"),
  _ = require("lodash"),
  Service = require("./../service"),
  localization = require("./../service/localization");
var Cryptr = require("cryptr");
var { Transaction } = require("./../models/transaction");
var Table = require("./../models/table");
var { WithdrawalRequest } = require("./../models/WithdrawalRequest");
const uniqid = require("uniqid");

var logger = require("./../service/logger");

cryptr = new Cryptr(config.cryptrSecret);

var ObjectId = require("mongoose").Types.ObjectId;

var checksum = require("../../api/service/paytm/checksum");

var utility = require("./utilityController");

module.exports = {
  pgredirect: async function (req, res) {
    // logger.info("in pgdirect");
    // logger.info("--------testtxnjs----");
    return res.render("pgredirect.ejs");
  },

  testtxnGet: async function (req, res) {
    var startTime = new Date();
    // logger.info("Add Money Request >> ", req.params);
    var params = _.pick(req.params, "uid");

    var user = await User.findOne({
      numeric_id: params.uid,
    });

    if (!user) {
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "testTXNGet");

      return res.render("testtxn.ejs", {
        status: 0,
        title: localization.tokenExpired,
      });
    } else {
      // var a = uniqid();
      // var b = params.uid;

      var order_id = utility.objectId();

      //var order_id = `${b}${a}`;
      // var order_id = uniqid();
      // var maxNumId = await Transaction.find({}, ['order_id'])
      //     .sort({
      //         order_id: -1
      //     })
      //     .limit(1);
      // var order_id;
      // if (maxNumId.length == 0) order_id = 10000;
      // else {
      //     if (maxNumId[0].order_id) order_id = parseInt(maxNumId[0].order_id) + 1;
      //     else order_id = 10000;
      // }
      logger.info("order_id---->", order_id);
      var data = _.pick(user, "_id", "name", "main_wallet", "numeric_id");
      data.order_id = order_id;
      data.user_id = data._id;

      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "testTXNGet");

      res.render("testtxn.ejs", {
        status: 1,
        data: data,
        config: config,
        host: config.pre + req.headers.host,
      });
    }
  },

  testtxnPost: async function (req, res) {
    var startTime = new Date();
    // logger.info("POST Order start");
    var paramarray = _.pick(
      req.body,
      "MID",
      "ORDER_ID",
      "CUST_ID",
      "INDUSTRY_TYPE_ID",
      "CHANNEL_ID",
      "TXN_AMOUNT",
      "WEBSITE"
    );
    paramarray.CALLBACK_URL = config.live_url + "/response"; //'http://localhost:3001/response'; // in case if you want to send callback
    paramarray.MERC_UNQ_REF = req.body.USERID;
    // logger.info("paramarray >>", paramarray);
    checksum.genchecksum(
      paramarray,
      config.PAYTM_MERCHANT_KEY,
      async function (err, result) {
        // logger.info("Result", result);

        var newOrder = new Transaction({
          user_id: result.MERC_UNQ_REF,
          txn_amount: result.TXN_AMOUNT,
          txn_win_amount: 0,
          txn_main_amount: result.TXN_AMOUNT,
          order_id: result.ORDER_ID,
          created_at: new Date().getTime(),
          txn_id: "",
          checksum: result,
          main_wallet_closing: 0,
          win_wallet_closing: 0,
          transaction_type: "C",
          txn_mode: "P",
        });

        var newOrderSave = await newOrder.save();

        if (!newOrderSave) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "testTXNPost");

          return res.render("pgredirect.ejs", {
            status: 0,
            msg: localization.ServerError,
          });
        } else {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "testTXNPost");

          return res.render("pgredirect.ejs", {
            status: 1,
            restdata: result,
          });
        }
        // var endTime = new Date();
        // utility.logElapsedTime(req, startTime, endTime, "testTXNPost");

        // return res.render('pgredirect.ejs', {
        //     status: 1,
        //     restdata: result
        // });
      }
    );

    // logger.info("POST Order end");
  },

  response: async function (req, res) {
    var startTime = new Date();

    // logger.info("in response post");
    var paramlist = req.body;
    var paramarray = _.pick(
      paramlist,
      "ORDERID",
      "MID",
      "TXNID",
      "TXNAMOUNT",
      "STATUS",
      "RESPMSG",
      "MERC_UNQ_REF"
    );
    if (checksum.verifychecksum(paramlist, config.PAYTM_MERCHANT_KEY)) {
      // logger.info("true");
      var status;
      if (
        paramarray.STATUS == "TXN_SUCCESS" &&
        paramarray.RESPMSG == "Txn Success"
      ) {
        status = "S";
      } else if (paramarray.STATUS == "PENDING") {
        status = "P";
      } else {
        status = "F";
      }

      var filter = {
        order_id: paramarray.ORDERID,
        user_id: paramarray.MERC_UNQ_REF,
      };
      var update = {
        txn_id: paramarray.TXNID,
        is_status: status,
        resp_msg: paramarray.RESPMSG,
      };

      var order = await Transaction.findOne(filter);

      if (order) {
        var orderUpdate = await order.updateOne(update);
        if (orderUpdate) {
          var user = await User.findOne({
            _id: paramarray.MERC_UNQ_REF,
          });

          if (user) {
            // user.main_wallet = user.main_wallet + parseInt(paramarray.TXNAMOUNT);
            // var balnceUpdate = await user.save();
            if (status == "S") {
              user.main_wallet =
                user.main_wallet + parseInt(paramarray.TXNAMOUNT);
              var balnceUpdate = await user.save();
            }

            if (balnceUpdate) {
              //logger.info('true');
              var endTime = new Date();
              utility.logElapsedTime(req, startTime, endTime, "response");

              res.render("response.ejs", {
                status: 1,
                msg: paramarray.RESPMSG,
                host: config.pre + req.headers.host,
              });
            } else {
              //logger.info("false");
              var endTime = new Date();
              utility.logElapsedTime(req, startTime, endTime, "response");

              return res.render("response.ejs", {
                status: 0,
                msg: Service.ServerError,
                host: config.pre + req.headers.host,
              });
            }
          } else {
            //logger.info("false");
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, "response");

            return res.render("response.ejs", {
              status: 0,
              msg: Service.ServerError,
              host: config.pre + req.headers.host,
            });
          }
        } else {
          //logger.info("false");
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "response");

          return res.render("response.ejs", {
            status: 0,
            msg: Service.ServerError,
            host: config.pre + req.headers.host,
          });
        }
      } else {
        //logger.info("false");
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "response");

        return res.render("response.ejs", {
          status: 0,
          msg: "Invalid order.",
        });
      }
    } else {
      //logger.info("false");
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "response");

      return res.render("response.ejs", {
        status: 0,
        msg: Service.tokenExpired,
      });
    }
  },

  //for cache implementation
  transactionsHistory: async function (req, res) {
    var startTime = new Date();

    //logger.info("Transactions History Request >> ", req.user._id);

    var key_userTransactionHistory = "userTransactionHistory" + req.user._id;

    userHistory = await Transaction.find({
      $or: [
        {
          user_id: req.user._id,
          transaction_type: { $ne: "D" },
        },
        {
          user_id: req.user._id,
          txn_mode: { $ne: "A" },
        },
      ],
    });

    userHistory = userHistory.map((d) => {
      return {
        status: d.is_status,
        txn_amount: d.txn_amount,
        txn_win_amount: d.txn_win_amount || 0,
        txn_main_amount: d.txn_main_amount || 0,
        txn_type: d.txn_mode || "G",
        created_at: d.created_at,
      };
    });

    var endTime = new Date();
    utility.logElapsedTime(req, startTime, endTime, "transactionHistory");

    return res
      .status(200)
      .json(Service.response(1, localization.TransactionsHistory, userHistory));
  },

  transactionList: async (limit) => {
    const transaction = await Transaction.find({})
      .populate("user_id")
      .sort({
        created_at: -1,
      })
      .limit(limit);

    let list = await Promise.all(
      transaction.map(async (u) => {
        if (u.user_id) {
          return {
            order_id: u.order_id,
            request_id: u?.request_id,
            username: _.capitalize(u.user_id.username),
            numeric_id: _.capitalize(u.user_id.search_id),
            user_id: u.user_id._id,
            txn_amount: u.txn_amount,
            win_wallet: u.txn_win_amount || 0,
            main_wallet: u.txn_main_amount || 0,
            created_at: u.created_at, //await Service.formateDateandTime(parseInt(u.created_at)),
            is_status: u.is_status,
            msg: u.resp_msg || "No Data Found",
            txn_mode: u.txn_mode || "G",
          };
        } else {
          return false;
        }
      })
    );

    let count = await Transaction.countDocuments();
    return {
      list: list.filter((d) => d),
      count: count,
    };
  },

  transactionListPending: async (limit) => {
    const transaction = await Transaction.find({
      is_status: "P",
      checksum: { $exists: true },
    })
      .populate("user_id")
      .sort({
        created_at: -1,
      })
      .limit(limit);

    let list = await Promise.all(
      transaction.map(async (u) => {
        if (u.user_id) {
          return {
            order_id: u.order_id,
            username: _.capitalize(u.user_id.name),
            user_id: u.user_id._id,
            txn_amount: u.txn_amount,
            current_balance:u.current_balance||0,
            win_wallet: u.txn_win_amount || 0,
            main_wallet: u.txn_main_amount || 0,
            created_at: u.created_at, 
            is_status: u.is_status,
            msg: u.resp_msg || "No Data Found",
            txn_mode: u.txn_mode || "G",
          };
        } else {
          return false;
        }
      })
    );

    let count = await Transaction.countDocuments({
      is_status: "P",
      checksum: { $exists: true },
    });
    return {
      list: list.filter((d) => d),
      count: count,
    };
  },

  getTxnAjax: async function (req, res) {
    var startTime = new Date();

    const params = req.query;
console.log("params", params);
    let matchObj = {};
    if (params.search) {
      if (params.search.value.trim() != "") {
        matchObj["$or"] = [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$users.numeric_id" },
                regex: params.search.value,
                options: "i"
              }
            }
          },
          {
            request_id: {
              $regex: params.search.value,
              $options: "i",
            },
          },
          {
            resp_msg: {
              $regex: params.search.value,
              $options: "i",
            },
          },

        ];
      }
    }

    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        // console.log(params.order[0]);
        // if (params.order[0].column == "0") {
        //   // SORT BY TXN AMOUNT
        //   sortObj.request_id = params.order[0].dir == "asc" ? 1 : -1;
        // }
          if (params.order[0].column == "2") {
          // SORT BY TXN AMOUNT
          sortObj.txn_amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "3") {
          // SORT BY WIN WALLET
          sortObj.current_balance = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "4") {
          // SORT BY MAIN WALLET
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "1") {
          // SORT BY DATE
          sortObj.numeric_id = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = { created_at: -1 };
        }
      } else {
        sortObj = { created_at: -1 };
      }
    } else {
      sortObj = { created_at: -1 };
    }

    const user_id = params.id || "";

    if (Service.validateObjectId(user_id)) {
      matchObj.user_id = ObjectId(user_id);
    }

    if (!_.isEmpty(params.status)) {
      matchObj.is_status = params.status;
    }

    if (!_.isEmpty(params.type)) {
      matchObj.txn_mode = params.type;
    }
    if (!_.isEmpty(params.rank)) {
      matchObj["users.role"] = params.rank;
    }
    if (!_.isEmpty(params.startDate)) {
      let sdate = params.startDate;
      let timestamp
      let dateObject = new Date(sdate);
      if (!isNaN(dateObject.getTime())) {
         timestamp = dateObject.getTime();
        console.log(timestamp);
      } else {
        console.error("Invalid date string");
      }
      
      matchObj.created_at = {
                $gte: timestamp.toString()
              }
    }
    if (!_.isEmpty(params.endDate)) {
      let sdate = params.endDate + 'T23:59:59.999Z';
      let timestamp
      let dateObject = new Date(sdate);
      if (!isNaN(dateObject.getTime())) {
         timestamp = dateObject.getTime();
      } else {
        console.error("Invalid date string");
      }
        matchObj.created_at = {
          $lt: timestamp.toString()
      };
    }
    if (!_.isEmpty(params.endDate)&&!_.isEmpty(params.startDate)) {
      let startdate = params.startDate ;
      let endDate = params.endDate + 'T23:59:59.999Z';
      let timestampstart
      let timestampsend
      let dateObjectstart = new Date(startdate);
      let dateObjectend = new Date(endDate);
      if (!isNaN(dateObjectstart.getTime())) {
        timestampstart = dateObjectstart.getTime();
      } else {
        console.error("Invalid date string");
      }
      if (!isNaN(dateObjectend.getTime())) {
        timestampsend = dateObjectend.getTime();
      } else {
        console.error("Invalid date string");
      }
        matchObj.created_at = {
          $gte: timestampstart.toString(),
          $lt: timestampsend.toString()
      };
    }
    
    let aggregation_obj = [];
    aggregation_obj.push(
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $unwind: "$users",
      }
    );
  

    if (matchObj != {})
      aggregation_obj.push({
        $match: matchObj,
      });

    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: params.start == "All" ? 0 : parseInt(params.start),
      }
      // limit
      // { $limit: params.length == -1 ? null :  parseInt(params.length) },
    );

    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }

    aggregation_obj.push({
      $project: {
        _id: 1,
        // no:u++,
        // txn_win_amount: 1,
        // txn_main_amount: 1,
        created_at: 1,
        current_balance:1,
        txn_amount: 1,
        payment_mode: 1,
        username: "$users.name",
        numeric_id: "$users.search_id",
        user_id: "$users._id",
        resp_msg: 1,
        role: "$users.role",
        // request_id: 1,
        is_status: 1,
        txn_mode: 1,
      },
    });

    // logger.info("AGGRE", JSON.stringify(aggregation_obj, undefined, 2));

    let list = await Transaction.aggregate(aggregation_obj).allowDiskUse(true);
    console.log(aggregation_obj);
    let aggregate_rf = [];

    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }

    aggregate_rf.push({
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    });

    // logger.info("aggregate_rf", aggregate_rf);
    let rF = await Transaction.aggregate(aggregate_rf).allowDiskUse(true);

    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await Transaction.find({}).countDocuments();

    list = await Promise.all(
      list.map(async (u,index) => {
    
        let txn_amount = u.txn_amount;

        if (u.txn_amount > 0) {
          txn_amount =
            '<span class="label label-success">' + u.txn_amount + "</span>";
        } else {
          txn_amount =
            '<span class="label label-danger">' + u.txn_amount + "</span>";
        }
        let txn_mode = u.txn_mode;
        if (u.txn_mode == "G") {
          txn_mode = "GAME";
        } else if (u.txn_mode == "P") {
          txn_mode = "Payment";
          // console.log("UU", u.txn_mode);
          if (!u.txn_mode) txn_mode += " - Paytm";
          else if (u.txn_mode == "PA") txn_mode += " - Paytm";
          else if (u.txn_mode == "N/A") txn_mode += "";
          else txn_mode += " - Cashfree " + u.txn_mode;
        } 
        else if (u.txn_mode == "A") {
          txn_mode = "ADMIN";
        }
        else if (u.txn_mode == "GIFT") {
          txn_mode = "GIFT";
        }
         else if (u.txn_mode == "B") {
          txn_mode = "BONUS";
        } else if (u.txn_mode == "R") {
          txn_mode = "WITHDRAW";
        } else if (u.txn_mode == "A") {
          txn_mode = "REFERRAL";
        } else if (u.txn_mode == "O") {
          txn_mode = "OTHER";
        } else if (u.txn_mode == "S") {
          txn_mode = "SCRATCH CARD";
        }else{
          txn_mode = "GAME";
        }
let current_balance= u.current_balance
        let status_ = u.is_status;

        if (status_ == "P") {
          status_ = '<span class="label label-warning">Pending</span>';
        } else if (status_ == "S") {
          status_ = '<span class="label label-success">Success</span>';
        } else {
          status_ = '<span class="label label-danger">Failed</span>';
        }

        let roles=u.role
        if (roles == "State") {
          roles = 'State';
        } 
        else if (roles == "Zone") {
          roles = 'Zone';
        }
        else if (roles == "District") {
          roles = 'District';
        }
        else if (roles == "Agent") {
          roles = 'Agent';
        }
let created=await Service.formateDateandTime(u.created_at)
        return [
          ++index,
          // u?.request_id ?? '',
          `<a target="_blank" href="${config.pre + req.headers.host
          }/user/view/${u.user_id}">${u.numeric_id}</a>`,
          txn_amount,
          // u.txn_win_amount || 0,
          // u.txn_main_amount || 0,
        current_balance,
          // `<div class="time_formateDateandTime2">${u.created_at}</div>`,
          created,
          txn_mode,
          u.resp_msg ? u.resp_msg : "No Data Found",
          status_,
          role=u.role,
        ];
      })
    );

    var endTime = new Date();
    // utility.logElapsedTime(req, startTime, endTime, "getTXNAjax");

    return res.status(200).send({
      data: await list,
      draw: new Date().getTime(),
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered,
    });
  },
  getTransferAjax: async function (req, res) {
    var startTime = new Date();

    const params = req.query;
    let matchObj = {};
    if (params.search) {
      if (params.search.value.trim() != "") {
        matchObj["$or"] = [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$users.numeric_id" },
                regex: params.search.value,
                options: "i"
              }
            }
          },
          {
            request_id: {
              $regex: params.search.value,
              $options: "i",
            },
          },
          {
            resp_msg: {
              $regex: params.search.value,
              $options: "i",
            },
          },

        ];
      }
    }

    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        // console.log(params.order[0]);
        // if (params.order[0].column == "0") {
        //   // SORT BY TXN AMOUNT
        //   sortObj.request_id = params.order[0].dir == "asc" ? 1 : -1;
        // }
          if (params.order[0].column == "2") {
          // SORT BY TXN AMOUNT
          sortObj.txn_amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "3") {
          // SORT BY WIN WALLET
          sortObj.current_balance = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "4") {
          // SORT BY MAIN WALLET
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "1") {
          // SORT BY DATE
          sortObj.numeric_id = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = { created_at: -1 };
        }
      } else {
        sortObj = { created_at: -1 };
      }
    } else {
      sortObj = { created_at: -1 };
    }

    const user_id = params.id || "";

    if (Service.validateObjectId(user_id)) {
      matchObj.user_id = ObjectId(user_id);
      
    }

    if (!_.isEmpty(params.status)) {
      matchObj.is_status = params.status;
    }

    if (!_.isEmpty(params.type)) {
      matchObj.txn_mode = params.type;
    }
    if (!_.isEmpty(params.rank)) {
      matchObj["users.role"] = params.rank;
    }
    if (!_.isEmpty(params.startDate)) {
      let sdate = params.startDate;
      let timestamp
      let dateObject = new Date(sdate);
      if (!isNaN(dateObject.getTime())) {
         timestamp = dateObject.getTime();
        console.log(timestamp);
      } else {
        console.error("Invalid date string");
      }
      
      matchObj.created_at = {
                $gte: timestamp.toString()
              }
    }
    if (!_.isEmpty(params.endDate)) {
      let sdate = params.endDate + 'T23:59:59.999Z';
      let timestamp
      let dateObject = new Date(sdate);
      if (!isNaN(dateObject.getTime())) {
         timestamp = dateObject.getTime();
      } else {
        console.error("Invalid date string");
      }
        matchObj.created_at = {
          $lt: timestamp.toString()
      };
    }
    if (!_.isEmpty(params.endDate)&&!_.isEmpty(params.startDate)) {
      let startdate = params.startDate ;
      let endDate = params.endDate + 'T23:59:59.999Z';
      let timestampstart
      let timestampsend
      let dateObjectstart = new Date(startdate);
      let dateObjectend = new Date(endDate);
      if (!isNaN(dateObjectstart.getTime())) {
        timestampstart = dateObjectstart.getTime();
      } else {
        console.error("Invalid date string");
      }
      if (!isNaN(dateObjectend.getTime())) {
        timestampsend = dateObjectend.getTime();
      } else {
        console.error("Invalid date string");
      }
        matchObj.created_at = {
          $gte: timestampstart.toString(),
          $lt: timestampsend.toString()
      };
    }
    
    let aggregation_obj = [];
    aggregation_obj.push(
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $unwind: "$users",
      }
    );
  

    if (matchObj != {})
      aggregation_obj.push({
        $match: matchObj,
      });

    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: params.start == "All" ? 0 : parseInt(params.start),
      }
      // limit
      // { $limit: params.length == -1 ? null :  parseInt(params.length) },
    );

    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }

    aggregation_obj.push({
      $project: {
        _id: 1,
        // no:u++,
        // txn_win_amount: 1,
        // txn_main_amount: 1,
        created_at: 1,
        current_balance:1,
        txn_amount: 1,
        payment_mode: 1,
        username: "$users.name",
        numeric_id: "$users.search_id",
        user_id: "$users._id",
        resp_msg: 1,
        role: "$users.role",
        // request_id: 1,
        is_status: 1,
        txn_mode: 1,
      },
    });


    let list = await Transaction.aggregate(aggregation_obj).allowDiskUse(true);
    console.log(aggregation_obj);
    let aggregate_rf = [];

    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }

    aggregate_rf.push({
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    });

    // logger.info("aggregate_rf", aggregate_rf);
    let rF = await Transaction.aggregate(aggregate_rf).allowDiskUse(true);

    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await Transaction.find({}).countDocuments();

    list = await Promise.all(
      list.map(async (u,index) => {
    
        let txn_amount = u.txn_amount;

        if (u.txn_amount > 0) {
          txn_amount =
            '<span class="label label-success">' + u.txn_amount + "</span>";
        } else {
          txn_amount =
            '<span class="label label-danger">' + u.txn_amount + "</span>";
        }
        let txn_mode = u.txn_mode;
        if (u.txn_mode == "G") {
          txn_mode = "GAME";
        } else if (u.txn_mode == "P") {
          txn_mode = "Payment";
          // console.log("UU", u.txn_mode);
          if (!u.txn_mode) txn_mode += " - Paytm";
          else if (u.txn_mode == "PA") txn_mode += " - Paytm";
          else if (u.txn_mode == "N/A") txn_mode += "";
          else txn_mode += " - Cashfree " + u.txn_mode;
        } 
        else if (u.txn_mode == "A") {
          txn_mode = "ADMIN";
        }
        else if (u.txn_mode == "GIFT") {
          txn_mode = "GIFT";
        }
         else if (u.txn_mode == "B") {
          txn_mode = "BONUS";
        } else if (u.txn_mode == "R") {
          txn_mode = "WITHDRAW";
        } else if (u.txn_mode == "A") {
          txn_mode = "REFERRAL";
        } else if (u.txn_mode == "O") {
          txn_mode = "OTHER";
        } else if (u.txn_mode == "S") {
          txn_mode = "SCRATCH CARD";
        }else{
          txn_mode = "GAME";
        }
let current_balance= u.current_balance
        let status_ = u.is_status;

        if (status_ == "P") {
          status_ = '<span class="label label-warning">Pending</span>';
        } else if (status_ == "S") {
          status_ = '<span class="label label-success">Success</span>';
        } else {
          status_ = '<span class="label label-danger">Failed</span>';
        }

        let roles=u.role
        if (roles == "State") {
          roles = 'State';
        } 
        else if (roles == "Zone") {
          roles = 'Zone';
        }
        else if (roles == "District") {
          roles = 'District';
        }
        else if (roles == "Agent") {
          roles = 'Agent';
        }
let created=await Service.formateDateandTime(u.created_at)
        return [
          ++index,
          // u?.request_id ?? '',
          `<a target="_blank" href="${config.pre + req.headers.host
          }/user/view/${u.user_id}">${u.numeric_id}</a>`,
          txn_amount,
          // u.txn_win_amount || 0,
          // u.txn_main_amount || 0,
        current_balance,
          // `<div class="time_formateDateandTime2">${u.created_at}</div>`,
          created,
          txn_mode,
          u.resp_msg ? u.resp_msg : "No Data Found",
          status_,
          role=u.role,
        ];
      })
    );

    var endTime = new Date();
    // utility.logElapsedTime(req, startTime, endTime, "getTXNAjax");

    return res.status(200).send({
      data: await list,
      draw: new Date().getTime(),
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered,
    });
  },

  withdrawRequest: async (req, res) => {
    var startTime = new Date();

    try {
      const params = _.pick(req.body, [
        "amount",
        "account_name",
        "account_no",
        "bank_name",
        "ifsc_code",
        "payment_type",
        "mobile_no",
      ]);
      //logger.info('Withdrawal Request :: ', params);

      if (_.isEmpty(params.payment_type)) {
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(Service.response(0, localization.missingParamError, null));
      }

      if (params.amount <= 0) {
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(Service.response(0, localization.invalidAmountError, null));
      }

      if (
        params.payment_type.trim() != "paytm" &&
        params.payment_type.trim() != "bank"
      ) {
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(
            Service.response(0, localization.paymentTypeValidationError, null)
          );
      }

      if (params.payment_type == "paytm") {
        if (_.isEmpty(params.amount) || _.isEmpty(params.mobile_no)) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

          return res
            .status(200)
            .json(Service.response(0, localization.missingParamError, null));
        }

        const us = await User.findById(req.user._id);

        if (!us) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

          return res
            .status(200)
            .json(Service.response(0, localization.ServerError, null));
        }

        if (params.amount < 50) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

          return res
            .status(200)
            .json(Service.response(0, localization.minWithdrawalLimit, null));
        }

        if (us.win_wallet < params.amount) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

          return res
            .status(200)
            .json(
              Service.response(0, localization.insufficientWithdrawlError, null)
            );
        }

        if (!us.otp_verified || !us.email_verified) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

          return res
            .status(200)
            .json(Service.response(0, localization.accountVerifiedError, null));
        }

        const wq = new WithdrawalRequest({
          user_id: us._id,
          amount: params.amount,
          payment_type: params.payment_type,
          mobile_no: params.mobile_no,
          created_at: new Date().getTime(),
        });

        us.win_wallet = us.win_wallet - params.amount;
        var t = await us.save();
        // if (t) {
        //     logger.info("amount deducted", us.win_wallet);
        // }
        const rez = await wq.save();

        if (!rez) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

          return res
            .status(200)
            .json(Service.response(0, localization.ServerError, null));
        }
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(Service.response(1, localization.success, null));
      }

      if (params.payment_type == "bank") {
        if (
          _.isEmpty(params.amount) ||
          _.isEmpty(params.account_name) ||
          _.isEmpty(params.account_no) ||
          _.isEmpty(params.bank_name) ||
          _.isEmpty(params.ifsc_code)
        ) {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

          return res
            .status(200)
            .json(Service.response(0, localization.missingParamError, null));
        }
      }

      if (params.amount < 50) {
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(Service.response(0, localization.minWithdrawalLimit, null));
      }

      if (req.user.win_wallet < params.amount) {
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(
            Service.response(0, localization.insufficientWithdrawlError, null)
          );
      }

      if (!req.user.otp_verified || !req.user.email_verified) {
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(Service.response(0, localization.accountVerifiedError, null));
      }

      const weq = new WithdrawalRequest({
        user_id: req.user._id,
        amount: params.amount,
        account_name: params.account_name,
        account_no: params.account_no,
        bank_name: params.bank_name,
        ifsc_code: params.ifsc_code,
        payment_type: params.payment_type,
        mobile_no: req.user.mobile_no.number,
        created_at: new Date().getTime(),
      });

      //logger.info('With Request :: ', weq);

      req.user.win_wallet = req.user.win_wallet - params.amount;
      var t = await req.user.save();
      // if (t) {
      //     logger.info("amount deducted", req.user.win_wallet);
      // }

      const result = await weq.save();

      if (!result) {
        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

        return res
          .status(200)
          .json(Service.response(0, localization.ServerError, null));
      }
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

      res.status(200).json(Service.response(1, localization.success, null));
    } catch (err) {
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "withdrawRequest");

      res
        .status(200)
        .json(Service.response(0, localization.ServerError, err.message));
    }
  },

  // for cache implementation
  gameRecords: async function (req, res) {
    var startTime = new Date();

    //logger.info("Game Records Request >> ", req.body);

    userHistory = await Table.find(
      {
        "players.id": req.user._id,
      },
      {
        room: 1,
        created_at: 1,
        "players.$": 1,
      }
    );

    userHistory = userHistory.filter((d) => d.players[0].fees != 0);

    userHistory = userHistory.map((d) => {
      return {
        room: d.room,
        fees: d.players[0].fees,
        pl: d.players[0].pl,
        created_at: d.created_at || 0,
      };
    });

    var endTime = new Date();
    utility.logElapsedTime(req, startTime, endTime, "gameRecords");

    return res
      .status(200)
      .json(Service.response(1, localization.TransactionsHistory, userHistory));
  },

  withdrawHistory: async (req, res) => {
    var startTime = new Date();

    try {
      //logger.info("Withdrawal History Request >> ", req.body);

      var withdrawalHistory = await WithdrawalRequest.find({
        user_id: req.user._id,
      });

      withdrawalHistory = withdrawalHistory.map((d) => {
        return {
          mode: d.payment_type,
          amount: d.amount,
          status: d.is_status,
          created_at: d.created_at || 0,
        };
      });
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "withdrawHistory");

      return res
        .status(200)
        .json(
          Service.response(
            1,
            localization.TransactionsHistory,
            withdrawalHistory
          )
        );
    } catch (err) {
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "withdrawHistory");

      res
        .status(200)
        .json(Service.response(0, localization.ServerError, err.message));
    }
  },

  listAllAjaxGameRecode: async (req, res) => {
    var startTime = new Date();

    try {
      const params = req.query;
      // logger.info("QUERY", params);
      // logger.info(params.start);

      let matchObj = {
        $expr: {
          $eq: ["$no_of_players", { $size: "$players" }],
        },
      };

      const user_id = params.id || "";

      if (Service.validateObjectId(user_id)) {
        matchObj["players.id"] = ObjectId(user_id);
      }

      if (!_.isEmpty(params.type)) {
        matchObj["room_type"] = params.type;
      }

      if (!_.isEmpty(params.players) && !isNaN(params.players)) {
        matchObj["no_of_players"] = parseInt(params.players);
      }

      if (!_.isEmpty(params.amount) && !isNaN(params.amount)) {
        matchObj["room_fee"] = parseInt(params.amount);
      }

      if (params.search.value.trim() != "") {
        matchObj["$or"] = [{
          room: {
            $regex: params.search.value,
            $options: "i",
          }
        }, {
          "users.numeric_id": { $regex: params.search.value, $options: "i" }
        }];
      }

      let agg = [
        {
          $match: matchObj,
        },
      ];

      var sortObj = {};
      if (params.order) {
        if (params.order[0]) {
          if (params.order[0].column == "4") {
            // SORT BY USERNAME
            sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
          } else {
            sortObj = { created_at: -1 };
          }
        } else {
          sortObj = { created_at: -1 };
        }
      } else {
        sortObj = { created_at: -1 };
      }

      agg.push(
        {
          $sort: sortObj,
        },
        {
          $skip: params.start == "All" ? 0 : parseInt(params.start),
        }
      );

      if (params.length != -1) {
        agg.push({
          $limit: parseInt(params.length),
        });
      }

      agg.push(
        {
          $unwind: "$players",
        },
        {
          $lookup: {
            from: "users",
            localField: "players.id",
            foreignField: "_id",
            as: "users",
          },
        },
        {
          $unwind: "$users",
        },
      );

      agg.push({
        $group: {
          _id: "$_id",
          room: {
            $first: "$room",
          },
          room_type: {
            $first: "$room_type",
          },
          no_of_players: {
            $first: "$no_of_players",
          },
          created_by: {
            $first: "$created_by",
          },
          game_started_at: {
            $first: "$game_started_at",
          },
          game_completed_at: {
            $first: "$game_completed_at",
          },
          created_date: {
            $first: "$created_date",
          },
          created_at: {
            $first: "$created_at",
          },
          room_fee: {
            $first: "$room_fee",
          },
          players: {
            $push: {
              id: "$players.id",
              rank: "$players.rank",
              pl: "$players.pl",
              username: "$users.username",
              numeric_id: "$users.numeric_id",
            },
          },
        },
      });
      agg.push({
        $sort: {
          created_at: -1,
        },
      });
      agg.push({
        $project: {
          _id: 1,
          room: 1,
          room_type: 1,
          no_of_players: 1,
          created_by: 1,
          created_at: 1,
          game_started_at: 1,
          game_completed_at: 1,
          created_date: 1,
          room_fee: 1,
          players: 1,
          data: 1,
        },
      });

      // logger.info("AGGR", agg);

      const llist = await Table.aggregate(agg).option({
        allowDiskUse: true,
      });
      // console.log(llist);
      // console.log(llist[0].players);
      var gData = await Promise.all(
        llist.map(async (u) => {
          let datatoRender = "";

          if (u.players.length > 0) {
            for (let ij = 0; ij < u.players.length; ij++) {
              datatoRender += `<tr>
                        <td><a target="_blank" href="/user/view/${u.players[ij].id}">${u.players[ij].numeric_id}</a></td>
                        <td>${u.players[ij].rank}</td>
                        <td>${u.players[ij].pl}</td>
                        </tr>`;
            }
          }

          return [
            u.room,
            `<span class="label label-${u.room_type == "PUB" ? "success" : "info"
            }">${u.room_type == "PUB" ? "Public" : "Private"}</span>`,
            u.no_of_players,
            u.room_fee,
            `<div class="time_formateDateandTime2">${u.created_at}</div>`,
            `<table class="table">
                        <tr class="success">
                            <th>Player Id</th>
                            <th>Rank</th>
                            <th>PL</th>
                        </tr>
                        ${datatoRender}
                    </table>`,
          ];
        })
      );

      let total = await Table.find({
        $expr: {
          $eq: ["$no_of_players", { $size: "$players" }],
        },
      }).countDocuments();
      let total_f = await Table.find(matchObj).countDocuments();

      // logger.info('Final Returned Data :: ',gData);
      // logger.info("LLIST", llist);
      var endTime = new Date();
      // utility.logElapsedTime(req, startTime, endTime, "listAllAjaxGameRecode");

      return res.status(200).send({
        data: gData,
        draw: new Date().getTime(),
        recordsTotal: total,
        recordsFiltered: total_f,
      });
    } catch (err) {
      logger.info("ERR", err);
    }
  },
};
