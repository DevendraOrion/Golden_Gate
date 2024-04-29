var { User } = require("./../models/user"),
  config = require("./../../config"),
  _ = require("lodash"),
  Service = require("./../service"),
  localization = require("./../service/localization");
var Cryptr = require("cryptr");
var { Transaction } = require("./../models/transaction");
var  JoinGame  = require("./../models/joinGame");
var  Game_record_aviator  = require("./../models/game_record_avaitor");
var  Roulette_record  = require("./../models/game_record_roullete");
var  GameRecord  = require("./../models/game_record_cardRoullte");
var Table = require("./../models/table");
 var { Rank_Data } = require("./../models/rankData");
var { WithdrawalRequest } = require("./../models/WithdrawalRequest");
const uniqid = require("uniqid");

var logger = require("./../service/logger");

cryptr = new Cryptr(config.cryptrSecret);

var ObjectId = require("mongoose").Types.ObjectId;

var checksum = require("../../api/service/paytm/checksum");

var utility = require("./utilityController");
const { array } = require("mongoose/lib/utils");

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

  transferPoint: async (admin,TxnMode) => {
    let transaction;
    console.log(admin._id);
    if(TxnMode==="generate"){
       transaction = await Transaction.find({user_id:admin._id,txn_mode:"U"})
        .populate("user_id")
        .sort({
          created_at: -1,
        })
        console.log(transaction,"-=-=-==-")
    }else{
       transaction = await Transaction.find({refUser:admin._id,txn_mode:TxnMode})
      .populate("user_id")
      .sort({
        created_at: -1,
      })
      console.log(transaction,"-=-=-==-((((((((((((((((((())))))))))))))))))))")
    }
    let list = await Promise.all(
      transaction.map(async (u) => {
        if (u.user_id) {
          // console.log(u);
          return {
            order_id: u.order_id,
            transaction_type: u.transaction_type,
            request_id: u?.request_id,
            username: _.capitalize(u.user_id.first_name)+" "+_.capitalize(u.user_id.last_name),
            numeric_id: u.user_id.search_id,
            user_id: u.user_id._id,
            userRole: u.user_id.role,
            userNo: u.user_id.phone,
            txn_amount: u.txn_amount,
            win_wallet: u.txn_win_amount || 0,
            main_wallet: u.txn_main_amount || 0,
            created_at: u.created_at, //await Service.formateDateandTime(parseInt(u.created_at)),
            is_status: u.is_status,
            msg: u.resp_msg || "No Data Found",
            txn_mode: u.txn_mode || "G",
            beforeBalance:u.current_balance-u.txn_amount
          };
        } else {
          return false;
        }
      })
    );
// console.log(list);
    let count = list.length
    return {
      list: list.filter((d) => d),
      count: count,
    };
  },
  transactionList: async (limit,admin) => {
    // const transaction = await Transaction.find({})
    //   .populate("user_id").populate("refUser")
    //   .sort({
    //     created_at: -1,
    //   })
    //   .limit(limit);
    const transaction = await Transaction.aggregate([
      {
        '$lookup': {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'users'
        }
      },
      { '$unwind': '$users' },
      {
        '$lookup': {
          from: 'users',
          localField: 'refUser',
          foreignField: '_id',
          as: 'refUser'
        }
      },
      { '$unwind': '$refUser' },
      { '$match': { user_id: admin._id } },
      { '$match': {} },
      { '$sort': { created_at: -1 } },
      { '$skip': 0 },
      { '$limit': limit },
      {
        '$project': {
          _id: 1,
          username: [Object],
          refusername: [Object],
          transaction_type: 1,
          created_at: 1,
          resp_msg: 1,
          txn_amount: 1,
          current_balance: 1,
          payment_mode: 1,
          refSearch_id: '$refUser.search_id',
          search_id: '$users.search_id',
          user_id: '$users._id',
          role: '$users.role',
          is_status: 1,
          txn_mode: 1
        }
      }
    ])
// console.log(transaction);
    let list = await Promise.all(
      transaction.map(async (u) => {
        if (u.user_id) {
          return {
            order_id: u.order_id,
            transaction_type: u.transaction_type,
            request_id: u?.request_id,
            username:_.capitalize(u.user_id.first_name)+""+ _.capitalize(u.user_id.last_name),
            search_id: _.capitalize(u.user_id.search_id),
            refUsername: u.refUser != null ?_.capitalize(u.refUser.first_name)+""+ _.capitalize(u.refUser.last_name):"",
            refUserSearchId: u.refUser != null?_.capitalize(u.refUser.search_id):"",
            user_id: u.user_id._id,
            txn_amount: u.txn_amount,
            created_at: await Service.formateDateandTime(parseInt(u.created_at)), 
            is_status: u.is_status,
            current_balance: u.current_balance,
            msg: u.resp_msg || "No Data Found",
            txn_mode: u.txn_mode || "G",
          };
        } else {
          return false;
        }
      })
    );
    let count  = await Transaction.aggregate([{"$match":{"user_id":admin._id}},{"$match":{"is_status":{"$ne":"P"}}},{"$lookup":{"from":"users","localField":"user_id","foreignField":"_id","as":"users"}},{"$lookup":{"from":"users","localField":"refUser","foreignField":"_id","as":"refUser"}}]);

    return {
      list: list.filter((d) => d),
      count: count,
    };
  },
  performanceList: async (limit) => {
    let list = [
      {
      }
    ]
    return {
      list: list,
      count: 1,
    };
  },
  betHistory: async (limit,game) => {

    const betData = await Game_record_aviator.aggregate([
      {
        $match: {
          room_id:"1707461299239"
        }
      },
      {
        $sort: {
          created_at: -1 ,
        }
      },
      {
        $lookup: {
          from: "join_games",
          localField: "room_id",
          foreignField: "room_id",
          as: "joinData"
        }
      },
      // {
      //   $unwind:"$joinData"
      // },
      {
        $limit: limit 
      },

    ]);
    
  // console.log(betData);
  
    let list = await Promise.all(
      betData.map(async (u) => {
        // console.log(u);
        let totalPlayer=0
        let totalBetAmt=0
        let totalWinAmt=0
        let status=[]
        if(u.joinData){
          totalPlayer=u.joinData.length
          u.joinData.map((a)=>{
            totalBetAmt+=a.amount
            totalWinAmt+=a.win_amount
            status.push(a.is_updated)
          })
        }
        if (u) {
          return {
            room_id: u.room_id,
            created_at: Service.formateDateandTime(u.room_id),
            totalPlayer:totalPlayer,
            totalBetAmt:totalBetAmt,
            totalWinAmt:totalWinAmt,
            adminComm:u.admin_commission,
            result:u.distance,
            status:status[0]?status[0]:"Success",
          };
        } else {
          return false;
        }
      })
    );
// console.log(list);

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
///////////////////////////////////////////////////////////////////////////////////////////
  getBetHistoryTxnAjax: async function (req, res) {
    var startTime = new Date();
    const GameId=req.query.gameID
console.log(GameId);
    const params = req.query;
// console.log("params", params);
    let matchObj = {};


    var sortObj = { created: -1};

    const user_id = params.id || "";

    if (Service.validateObjectId(user_id)) {
      console.log("hi");
      matchObj["user._id"] = ObjectId(user_id);
    }

    if (!_.isEmpty(params.status)) {
      matchObj.is_updated = params.status;
    }

    if (!_.isEmpty(params.startDate)) {
      let sdate = params.startDate;
      let timestamp;
      let dateObject = new Date(sdate);
      if (!isNaN(dateObject.getTime())) {
          timestamp = dateObject.getTime();
          // console.log(timestamp);
      } else {
          console.error("Invalid date string");
      }
  
      let isoStartDate = new Date(sdate + 'T00:00:00Z');
  
      matchObj.created_at = {
          $gte: isoStartDate
      };
  }
  
  if (!_.isEmpty(params.endDate)) {
    let sdate = params.endDate + 'T23:59:59.999Z';
    let timestamp;
    let dateObject = new Date(sdate);
    if (!isNaN(dateObject.getTime())) {
        timestamp = dateObject.toISOString();
        console.log(timestamp);
    } else {
        console.error("Invalid date string");
    }
    matchObj.created_at = {
        $lt: new Date(timestamp)
    };
}

if (!_.isEmpty(params.endDate) && !_.isEmpty(params.startDate)) {
  let startdate = params.startDate;
  let endDate = params.endDate + 'T23:59:59.999Z';
  let timestampstart;
  let timestampend;
  let dateObjectstart = new Date(startdate);
  let dateObjectend = new Date(endDate);
  
  if (!isNaN(dateObjectstart.getTime())) {
      timestampstart = dateObjectstart.toISOString();
  } else {
      console.error("Invalid start date string");
  }
  
  if (!isNaN(dateObjectend.getTime())) {
      timestampend = dateObjectend.toISOString();
  } else {
      console.error("Invalid end date string");
  }
  
  matchObj.created_at = {
      $gte: new Date(timestampstart),
      $lt: new Date(timestampend)
  };
}


let aggregation_obj = [];

// Sort stage
if(GameId==2){
  aggregation_obj.push({
    $sort: {
      room_id: -1,
    }
});
}else{
  aggregation_obj.push({
    $sort: {
      created_at: -1,
    }
});
}

aggregation_obj.push({

    $lookup: {
        from: "join_games",
        localField: "room_id",
        foreignField: "room_id",
        as: "joinData"
    },

});

if (!_.isEmpty(matchObj)) {
    aggregation_obj.push({
        $match: matchObj,
    });
}

const pageSize = parseInt(params.length) || 10; 
const pageNumber = parseInt(params.start)/10 || 0; 
aggregation_obj.push({
    $skip: pageNumber * pageSize
}, {
    $limit: pageSize
});
// console.log(aggregation_obj);
let list;
if (GameId == "1") {
    list = await Roulette_record.aggregate(aggregation_obj).allowDiskUse(true);
} else if (GameId == "2") {
    list = await GameRecord.aggregate(aggregation_obj).allowDiskUse(true);
} else {
    list = await Game_record_aviator.aggregate(aggregation_obj).allowDiskUse(true);
}
console.log(list);



let recordsTotal = list.length;

let totalCountAggregate = [];
if (!_.isEmpty(matchObj)) {
    totalCountAggregate.push({
        $match: matchObj
    });
}
if (GameId == "1") {
    totalCountAggregate.push({
        $count: "totalCount"
    });
} else if (GameId == "2" || GameId == "3") {
    totalCountAggregate.push({
        $match: {
            game_id: GameId
        }
    }, {
        $count: "totalCount"
    });
}
// console.log(totalCountAggregate);
let totalAggregateResult;
if (totalCountAggregate.length > 0) {
    if (GameId == "1") {
        totalAggregateResult = await Roulette_record.aggregate(totalCountAggregate).allowDiskUse(true);
    } else if(GameId == "2") {
        totalAggregateResult = await GameRecord.aggregate(totalCountAggregate).allowDiskUse(true);
    } else  {
        totalAggregateResult = await Game_record_aviator.aggregate(totalCountAggregate).allowDiskUse(true);
    }
    recordsTotal = totalAggregateResult.length > 0 ? totalAggregateResult[0].totalCount : 0;
}
// console.log(totalAggregateResult);
let downLine=await Service.DownLine(req.admin._id)

// console.log( downLine);
list = await Promise.all(list.map(async (u, index) => {
  // console.log(u);
    let totalPlayer = 0;
    let totalBetAmt = 0;
    let totalWinAmt = 0;
    let commission=0
    let status ;
    if(GameId == "1"){
    status=  u.spots !== undefined?'<span class="label label-success"> Success</span>':'<span class="label label-warning"> Pending</span>'
  }else if(GameId=="2"){
      status=  u.winNo !== undefined?'<span class="label label-success"> Success</span>':'<span class="label label-danger"> Refund</span>'
    }else{
      status=  u.distance != "0"?'<span class="label label-success"> Success</span>':'<span class="label label-warning"> Pending</span>'
    }

    if (u.joinData) {
      // totalPlayer = u.joinData.length;
      await Promise.all(u.joinData.map(async (a) => {
        console.log(a.user_id)
          let findUser=await User.findOne({numeric_id:a.user_id});
        if (downLine.map(id => id.toString()).includes(findUser._id.toString())) {
            totalBetAmt += a.amount;
            totalWinAmt += a.win_amount;
            totalPlayer++
          console.log("================",req.admin._id);
          if (u.room_id) {
              let findData = await Transaction.aggregate([
                  {
                      $match: {
                          room_id: Number(u.room_id),
                          txn_mode: "C",
                          user_id:req.admin._id
                      }
                  },
                  {
                      $group: {
                          _id: u.room_id,
                          commission: { $sum: "$txn_amount" }
                      }
                  }
              ]);
              commission += findData[0] ? findData[0].commission : 0;
          } }
      }));
  }
    let spot;
    if (GameId == "1") {
      let parseData;
      if (u?.spots) {
          parseData = JSON.parse(u.spots);
      } else {
          parseData = null; 
      }
      spot = parseData?.["0"]-1 ?? " ";
      if(spot==-1){
        spot="00";
      }

    } else if (GameId == "2") {
      if(u.spot==0){
          spot = "Ace";
        }
        else if(u.spot==1){
          spot = "King";
        }
        else if(u.spot==2){
          spot = "Queen";
        }
        else if(u.spot==3){
          spot = "Jake";
        }
        else if(u.spot==4){
          spot = "10";
        }
       
    } else {
        spot = u.distance;
    }
    // let adminComm = u.admin_commission ? u.admin_commission : 0;
    // console.log(commission);
    return [
        ++index,
        u.room_id,
        Service.formateDateandTime(u.room_id),
        totalBetAmt.toFixed(2),
        totalWinAmt.toFixed(2),
        commission.toFixed(2),
        (totalBetAmt - totalWinAmt).toFixed(2),
        totalPlayer,
        spot,
        status,
        `<a  href="${config.pre + req.headers.host
        }/user/showSlotDetail/${u.room_id}/${GameId}"> <i class="fa fa-pencil"></i></a>`
    ];
}));

return res.status(200).send({
    data: await list,
    draw: new Date().getTime(),
    recordsTotal: recordsTotal,
    recordsFiltered: recordsTotal,
});

  },
  getTxnAjax: async function (req, res) {

    var startTime = new Date();
    console.log("ajax calll", req.query);
    const params = req.query;
    if(params.buttonWallete != "false" ){
      params.id = params.buttonWallete
    }
// console.log("params", params);
    let matchObj = {};
    var sortObj = {};

// console.log(req.admin._id)
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
      matchObj = { $or: [
        // { refUser: ObjectId(user_id) },
        { user_id: ObjectId(user_id) }
    ]}
    }else{
      matchObj = { $or: [
        // { refUser: ObjectId(user_id) },
        { user_id: ObjectId(req.admin._id) }
    ]}
    }

    if (!_.isEmpty(params.status)&& params.status !== " ") {
      if(params.status=="G"){
        // matchObj.txn_mode = "G";
      }else{
        matchObj.transaction_type = params.status;
      }
    }

    if (!_.isEmpty(params.type) && params.type !== " ") {
      matchObj.txn_mode = params.type;
    }
    let matchObj2 = {}
    if (!_.isEmpty(params.rank)) {
      matchObj2 = { $or: [
        { role: params.rank },
        { refUserRole: params.rank }
    ]}
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
    let total = 0
   if(req.admin.role!=="Company" && Object.keys(matchObj).length == 0){
    matchObj.user_id = req.admin._id
    total =  await Transaction.countDocuments({user_id : req.admin._id , txn_mode: {$ne: "C"} });
   }else{
     let incData=await Service.DownLine(req.admin._id)
     let a=incData.push(req.admin._id)
     matchObj.user_id = {$in:incData};
     total =  await Transaction.countDocuments({...matchObj , txn_mode: {$ne: "C"}});
   }
    // if (req.admin.role==="Company") {
    //   matchObj.user_id = {$in:incData};
    // }else {
    //   matchObj.user_id = req.admin._id;
    // }
    let aggregation_obj = [];
    if (matchObj != {})
    aggregation_obj.push({
      $match: matchObj,
    });
    
    if(params.status=="G"){
      // matchObj.txn_mode = "G";
      aggregation_obj.push({
        $match: {
          // is_status: {$ne: "P"} 
          txn_mode: {$ne: "C",$eq : "G"}
        }
      });
    }else{

      aggregation_obj.push({
        $match: {
          // is_status: {$ne: "P"} 
          txn_mode: {$ne: "C"}
        }
      });
    }

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
        $lookup: {
          from: "users",
          localField: "refUser",
          foreignField: "_id",
          as: "refUser",
        },
      },
      
      {
        $sort: sortObj,
      },
      {
        $skip: params.start == "All" ? 0 : parseInt(params.start),
      },
      {
        $limit: params.length != -1 ? parseInt(params.length) : null,
      }
    );
    
    // aggregation_obj.push({
    //   $facet: {
    //     checkRefUser: [
    //       {
    //         $match: {
    //           refUser: {$exists: true, $not: {$size: 0}}
    //         }
    //       },
    //       {
    //         $sort: sortObj,
    //       },
    //       // {
    //       //   $skip: params.start == "All" ? 0 : parseInt(params.start),
    //       // },
    //       // {
    //       //   $limit: params.length != -1 ? parseInt(params.length) : null,
    //       // }
    //     ],
    //     noRefUser: [
    //       {
    //         $match: {
    //           $expr: { $gt: [{ $size: "$refUser" }, 0] }
    //         }
    //       },
    //       {
    //         $group:{
    //           _id:"$user_id",
    //           txn_amount_total: { $sum: "$txn_amount" }, // Calculate total txn_amount
    //           data: { $push: "$$ROOT" }
    //         }
    //       }
    //     ]
    //   }
    // },

    // );
    
    let list;
  //   function printObject(obj) {
  //     for (const [key, value] of Object.entries(obj)) {
  //         console.log(`${key}: ${JSON.stringify(value)}`);
  //     }
  // }
  // printObject(aggregation_obj);
  
    if (aggregation_obj.length > 0) {
      list = await Transaction.aggregate(aggregation_obj).allowDiskUse(true);
    } else {
      list = await Transaction.find(matchObj)
        .sort(sortObj)
        .skip(params.start == "All" ? 0 : parseInt(params.start))
        .limit(params.length != -1 ? parseInt(params.length) : null);
    }
      // console.log(list[0].checkRefUser,"list");
      // console.log(list[0].checkRefUser,"list");
    list = list.map((a) => {
      let username = a.users[0].first_name + " " + a.users[0].last_name;
      let refusername;
      if (a.refUser[0]) {
        refusername = a.refUser[0].first_name + " " + a.refUser[0].last_name+" ("+a.refUser[0].search_id+")";
      }else{
        if(a.gameId==1){
          refusername=`Roullete(${a.room_id})`
        }
        else if(a.gameId==2){
          refusername=`Card Roullete(${a.room_id})`
        }
        else if(a.gameId==3){
          refusername=`Avaitor(${a.room_id})`
        }
      }
      let transaction_type = a.transaction_type;
      let created_at = a.created_at;
      let txn_amount = a.txn_amount;
      let resp_msg = a.resp_msg;
      let current_balance = a.current_balance;
      let payment_mode = a.payment_mode;
      let refSearch_id = " ";
      let refUserRole = " ";
      if (a.refUser[0]) {
        refSearch_id = a.refUser[0].search_id;
        refUserRole = a.refUser[0].role;
      }
      let search_id = a.users[0].search_id;
      let user_id = a.users[0]._id;
      let role = a.users[0].role;
      let txn_mode = a.txn_mode;
      let is_status = a.is_status;
      let gameId=a?.gameId??0
      return {
        username,
        refusername,
        transaction_type,
        created_at,
        txn_amount,
        resp_msg,
        current_balance,
        payment_mode,
        refSearch_id,
        refUserRole,
        search_id,
        user_id,
        role,
        txn_mode,
        is_status,
        gameId
      };
    });
    
    // console.log(list);
    
    // console.log(list);

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
// console.log(rF);
    let recordsFiltered = total
    var recordsTotal = await Transaction.find({}).countDocuments();

    list = await Promise.all(
      list.map(async (u,index) => {
    
        let txn_amount = u.txn_amount.toFixed(2);
        if (u.txn_amount > 0) {
          txn_amount =
            '<span class="label label-success">' + u.txn_amount.toFixed(2) + "</span>";
        } else {
          txn_amount =
            '<span class="label label-danger">' + u.txn_amount.toFixed(2) + "</span>";
        }

        let txn_mode = u.txn_mode;
        if (u.txn_mode == "G") {
          txn_mode = "GAME";
        } else if (u.txn_mode == "A") {
          txn_mode = "ADMIN";
        }
        else if (u.txn_mode == "T") {
          txn_mode = "Transaction";
        }
        else{
          txn_mode = "GAME";
        }

        let current_balance;
        let status_ = u.is_status;
        let status2 = u.is_status;
        if (status_ == "P") {
          status_ = '<span class="label label-warning">Pending</span>';
        } else if (status_ == "S") {
          status_ = '<span class="label label-success">Success</span>';
        } else {
          status_ = '<span class="label label-danger">Rejected</span>';
        }
        let Debit_credit = u.transaction_type;
        let BeforeBalance;

        if (Debit_credit == "D") {
      
          if(u.refUserRole=="Company" ){
            // console.log(u.username)
            Debit_credit = '<span class="label label-danger">Debit</span>';
            BeforeBalance=u.current_balance+u.txn_amount;
            current_balance= u.current_balance;
            // console.log(BeforeBalance,current_balance);
          }
           else if(u.role=="Company" ){
            Debit_credit = '<span class="label label-danger">Debit</span>';
            BeforeBalance=u.current_balance;
            current_balance= u.current_balance-u.txn_amount;

          }
          else if(u.gameId==2){
            Debit_credit = '<span class="label label-danger">Debit</span>';
            BeforeBalance=u.current_balance;
            current_balance= u.current_balance-u.txn_amount;
          }
          else if(u.gameId==1){
            Debit_credit = '<span class="label label-danger">Debit</span>';
            BeforeBalance=u.current_balance;
            current_balance= u.current_balance-u.txn_amount;
          }
          else if(u.gameId==3){
            Debit_credit = '<span class="label label-danger">Debit</span>';
            BeforeBalance=u.current_balance;
            current_balance= u.current_balance-u.txn_amount;
          }
          else{
            Debit_credit = '<span class="label label-danger">Debit</span>';
            BeforeBalance=u.current_balance+u.txn_amount;
            current_balance= u.current_balance;

          }
          console.log("5")

        }  else {
          if(u.refUserRole=="Company"){
            Debit_credit = '<span class="label label-success">Credit</span>';
            BeforeBalance=u.current_balance;
            current_balance= u.current_balance+u.txn_amount;
            // console.log("===========",BeforeBalance,current_balance);
          }else if(u.role=="Company"){
            Debit_credit = '<span class="label label-success">Credit</span>';
            BeforeBalance=u.current_balance;
            current_balance= u.current_balance+u.txn_amount;
            // console.log("===========",BeforeBalance,current_balance);
          }
          else if(u.role=="User"||u.role=="Agent" ||u.role=="Zone"||u.role=="District"||u.role=="State"){
            Debit_credit = '<span class="label label-success">Credit</span>';
            BeforeBalance=u.current_balance-u.txn_amount;
            current_balance= u.current_balance;
          }
          else{
            Debit_credit = '<span class="label label-success">Credit</span>';
            BeforeBalance=u.current_balance
            current_balance= u.current_balance+u.txn_amount
          }
        }
        let created=await Service.formateDateandTime(u.created_at)
        if(status2 != "S" && status2 != "P"){
          current_balance =  BeforeBalance
        }
        if(req.admin.role=="Company" ){
          // console.log(Debit_credit,"-=-==--=" ,u.transaction_type,u.search_id)
          if(u.transaction_type== "C"){
            return [
              ++index,
              // u?.request_id ?? '',
              u.refusername,
              ` ${u.username}(${u.search_id})`,
              Debit_credit,
              u.resp_msg,
              created,
              BeforeBalance.toFixed(2),
              txn_amount,
              current_balance.toFixed(2),
              status_,
            ]; 
          }
          return [
            ++index,
            // u?.request_id ?? '',
            ` ${u.username}(${u.search_id})`,
            u.refusername,
            Debit_credit,
            u.resp_msg,
            created,
            BeforeBalance.toFixed(2),
            txn_amount,
            current_balance.toFixed(2),
            status_,
          ];
        }else{
          if(u.transaction_type== "D"){
            return [
              ++index,
              // u?.request_id ?? '',
              ` ${u.username}(${u.search_id})`,
              u.refusername,
              Debit_credit,
              u.resp_msg,
              created,
              BeforeBalance.toFixed(2),
              txn_amount,
              current_balance.toFixed(2),
              status_,
            ];
          }
          return [
            ++index,
            // u?.request_id ?? '',
            u.refusername,
            ` ${u.username}(${u.search_id})`,
            Debit_credit,
            u.resp_msg,
            created,
            BeforeBalance.toFixed(2),
            txn_amount,
            current_balance.toFixed(2),
            status_,
          ];
        }
      })
    );



    return res.status(200).send({
      data: await list,
      draw: new Date().getTime(),
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered,
    });
  },
  getperformance: async (req, res) => {
  try {
    let alluserPlayPoint = 0 ;
    let alluserWinPoint = 0;
    let alluserEndsPoint = 0;
    let params = req.query;
    let matchObj = {};
    console.log(req.admin.role)
    let fristrank ;
    if(req.admin.role=="Company"){
      fristrank = "State"
    }else if(req.admin.role=="State"){
      fristrank = "District"
    }else if(req.admin.role=="District"){
      fristrank = "Zone"
    }else if(req.admin.role=="Zone"){
      fristrank = "Agent"
    }else if(req.admin.role=="Agent"){
      fristrank = "User"
    }
    let role = params.rank || fristrank;
    matchObj.role = role;
    if(!_.isEmpty(params.id)){
      matchObj._id = params.id
    }

    const stateIds = await User.find(
      matchObj,
      { _id: 1, name: 1 }
    ).select("_id search_id name");
    const childUserIds = await Promise.all(
      stateIds.map(async ({ _id }) => await findUserIDs(_id))
    );
    async function findUserIDs(parentId) {
      let userIDs = [parentId];
      let users = await User.find({ parent: parentId }, { _id: 1 }).lean();
      while (users.length > 0) {
        const userIdsArray = users.map(({ _id }) => _id);
        userIDs.push(...userIdsArray);
        users = await User.find({ parent: { $in: userIdsArray } }, { _id: 1 }).lean();
      }
      return userIDs;
    }
    const start = parseInt(params.start);
    const end = parseInt(params.length)+start;
        let i =1
        let list = []
      for(let userIds of childUserIds) {
        if(start >=i){
          i++
          continue
        }
        const totalPoints = await User.aggregate([
          { $match: { _id: { $in: userIds }, role: "User" } },
          {
            $group: {
              _id: null,
              totalPlayPoint: { $sum: "$totalplaypoint" },
              totalWinningPoint: { $sum: "$totalwinningpoint" },
            },
          }
        ]);

        const {
          totalPlayPoint = 0,
          totalWinningPoint = 0,
        } = totalPoints[0] || {};

        const endPoint = totalPlayPoint - totalWinningPoint;
        list.push([ i, 1, totalPlayPoint, totalWinningPoint, endPoint, 0, 0])
        alluserPlayPoint += totalPlayPoint
        alluserWinPoint += totalWinningPoint
        alluserEndsPoint += endPoint
        if(i == end){
          break
        }
        i++
        }
        list.push(["","TOTAL",alluserPlayPoint.toFixed(2),alluserWinPoint.toFixed(2),alluserEndsPoint.toFixed(2),0,0,0])
    return res.status(200).json({
      data: list,
      draw: Date.now(),
      recordsTotal: stateIds.length,
      recordsFiltered: stateIds.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
},


  userName: async function (req, res) {
    let UserId=req.query.userId

    let FindData=await User.findOne({numeric_id:UserId})
    console.log(FindData.search_id);
    return res.send({status:200,data:FindData.search_id})
    // return {name:FindData.search_id}
  },
  getCommissionAjax: async function (req, res) {
    var startTime = new Date();
console.log("+============");
    const params = req.query;
// console.log("params", params);
    let matchObj = {};
    var sortObj = {};
  matchObj.is_status= {$ne:"P"} ;
  matchObj.txn_mode="C" ;

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
      matchObj = { $or: [
        // { refUser: ObjectId(user_id) },
        { user_id: ObjectId(user_id) }
    ]}
    }

    if (!_.isEmpty(params.status)&& params.status !== " ") {
      matchObj.transaction_type = params.status;
    }

    if (!_.isEmpty(params.type) && params.type !== " ") {
      matchObj.txn_mode = params.type;
    }
    let matchObj2 = {}
    if (!_.isEmpty(params.rank)) {
      matchObj2.role = params.rank
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
    }else{
let today = new Date();

let daysToSubtract = today.getDay() ;
if (daysToSubtract < 0) {
  daysToSubtract = 6;
}

let mondayDate = new Date(today.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));

mondayDate.setHours(0, 0, 0, 0);

// let mondayTimestamp = mondayDate.getTime() / 1000; // before 
let mondayTimestamp = mondayDate.getTime() ; 

console.log(mondayDate);

// console.log(previousSundayTimestamp);
      matchObj.created_at = {
        $gte: mondayTimestamp.toString()
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
    
   
    let incData=await Service.DownLine(req.admin._id)
    let a=incData.push(req.admin._id)

    if (req.admin.role==="Company") {
      matchObj.user_id = {$in:incData};
    }else {
      matchObj.user_id = req.admin._id;
    }
    let aggregation_obj = [];
    if (matchObj != {})
    aggregation_obj.push({
      $match: matchObj,
    });
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
    },
    {
      $group:{
        _id: "$users._id",
        searchId:{$first:"$users.search_id"},
        txn_amount:{$sum:"$txn_amount"},
        created_at:{$first:"$created_at"},
        txn_mode:{$first:"$txn_mode"},
        first_name:{$first:"$users.first_name"},       
        last_name:{$first:"$users.last_name"},   
        transaction_type:{$first:"$transaction_type"},
        current_balance:{$first:"$current_balance"},
        resp_msg:{$first:"$resp_msg"},
        is_status:{$first:"$is_status"},
        role:{$first:"$users.role"},    
      }
    });

    aggregation_obj.push({
      $match: matchObj2,
    });

    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: params.start == "All" ? 0 : parseInt(params.start),
      },
      
    );

    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }
console.log(aggregation_obj);
    let list = await Transaction.aggregate(aggregation_obj).allowDiskUse(true);
    list = list.map((a) => {
      let username = a.first_name + " " + a.last_name;
      let creditDebit=a.transaction_type;
      let subject=a.resp_msg;
      let txn_amount=a.txn_amount;
      let status=a.is_status;
      let search_id= a.searchId;
      let current_balance=a.current_balance;
      let resp_msg=a.resp_msg
      return {
        username,
        creditDebit,
        subject,
        txn_amount,
        status,
        search_id,
        current_balance,
        resp_msg
      };
    });
    
    let aggregate_rf = [];

    if (matchObj) {
      aggregate_rf.push(
        {
        $match: matchObj,
      },  {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "users",
        },
      },
    {
      $unwind: "$users",
    },
    {
      $group:{
        _id: "$users._id",
        searchId:{$first:"$users.search_id"},
        txn_amount:{$sum:"$txn_amount"},
        created_at:{$first:"$created_at"},
        txn_mode:{$first:"$txn_mode"},
        first_name:{$first:"$users.first_name"},       
        last_name:{$first:"$users.last_name"},   
        transaction_type:{$first:"$transaction_type"},
        current_balance:{$first:"$current_balance"},
        resp_msg:{$first:"$resp_msg"},
        is_status:{$first:"$is_status"},    
      }
    }
      );
    }

    aggregate_rf.push({
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    });


    let rF = await Transaction.aggregate(aggregate_rf).allowDiskUse(true);

    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await Transaction.find({}).countDocuments();

    list = await Promise.all(
      list.map(async (u,index) => {
     let debitCreit=u.creditDebit
     if(debitCreit==="C"){
      debitCreit = '<span class="label label-success">Credit</span>';
     }else{
      debitCreit = '<span class="label label-danger">Debit</span>';
     }
     let is_status=a.status
     if(is_status==="P"){
      is_status = '<span class="label label-warning">Pending</span>';
     }else{
      is_status = '<span class="label label-success">Success</span>';
     }
        return [
          ++index,
          ` ${u.username}(${u.search_id})`,
          debitCreit,
          u.resp_msg,
          (u.current_balance-u.txn_amount).toFixed(2),
          (u.txn_amount).toFixed(2),
          (u.current_balance).toFixed(2),
          is_status,
        ];
      })
    );



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
    let chip=params.chip
    // console.log(chip);
    let matchObj = {};
    var sortObj = {created_at: -1};

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
    let incData=await Service.DownLine(req.admin._id)
// console.log(req.admin._id)
    let aggregation_obj = [];
    if(chip=="generate"){
      aggregation_obj.push(
        {$match:{
          txn_mode:"U",
          user_id:req.admin._id
        }},
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
    }else{
      aggregation_obj.push(
        {
          $match:{
          txn_mode:"T",
          // user_id:req.admin._id,
          $or: [
            { user_id:req.admin._id },
            { refUser:req.admin._id }
          ]
        }
      },
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
    }
  
  

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
        created_at: 1,
        current_balance:1,
        txn_amount: 1,
        payment_mode: 1,
        username: { $concat: ["$users.first_name", " ", "$users.last_name"] },
        transaction_type:1,
        numeric_id: "$users.search_id",
        mobileNo: "$users.phone",
        user_id: "$users._id",
        resp_msg: 1,
        role: "$users.role",
        is_status: 1,
        txn_mode: 1,
      },
    },
    );

    // console.log(aggregation_obj);

    let list = await Transaction.aggregate(aggregation_obj).allowDiskUse(true);
    let aggregate_rf = [];
    if(chip=="generate"){
      if (matchObj != {}) {
        aggregate_rf.push({
          $match: { txn_mode:"U",
          user_id:req.admin._id},
        });
      }
    }else{
      if (matchObj != {}) {
        aggregate_rf.push({
          $match: { txn_mode:"T",
          user_id:req.admin._id},
        });
      }
    }
  
    
    aggregate_rf.push({
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    });
    
    let rF = await Transaction.aggregate(aggregate_rf).allowDiskUse(true);

    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await Transaction.find({}).countDocuments();

    list = await Promise.all(
      list.map(async (u,index) => {
    // console.log(u.role,u.transaction_type);
        let txn_amount = u.txn_amount;

        if (u.txn_amount > 0) {
          txn_amount =
            '<span class="label label-success">' + u.txn_amount + "</span>";
        } else {
          txn_amount =
            '<span class="label label-danger">' + u.txn_amount + "</span>";
        }
        let txn_mode = u.transaction_type;
        // console.log(u.transaction_type === "C");
        if (u.transaction_type === "C") {
          txn_mode = '<span class="label label-success">Credit</span>'
        } 
        if(u.transaction_type === "D"){
          txn_mode = '<span class="label label-danger">Debit</span>'
        }

        let current_balance= u.current_balance
        let status_ = u.is_status;
        // console.log(status_);
        if (status_ == "P") {
          status_ = '<span class="label label-warning">Pending</span>';
        } else if (status_ == "S") {
          status_ = '<span class="label label-success">Success</span>';
        } else {
          status_ = '<span class="label label-danger">Cancled</span>';
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
        let BeforeBalance;

        if (u.transaction_type == "D") {

          if(req.admin.role=="Company"){
            // console.log("admin");
            if(u.role=="Company"){
              BeforeBalance=u.current_balance;
              current_balance= u.current_balance-u.txn_amount;
              
            }else{
            // console.log("hi");
            BeforeBalance=u.current_balance;
            current_balance= u.current_balance-u.txn_amount;
          }

          }else{
            BeforeBalance=u.current_balance+u.txn_amount;

          }
        }  else {
         
          if(req.admin.role=="Company"){
            if(u.role=="Company"){
              BeforeBalance=u.current_balance;
              current_balance= u.current_balance+u.txn_amount;
              console.log(BeforeBalance,current_balance,"emasdof");
            }else{
              current_balance= u.current_balance+u.txn_amount;
              BeforeBalance=u.current_balance;
            }
          }else{
            BeforeBalance=u.current_balance-u.txn_amount
          }

        }
        return [
          ++index,
          ` <p><span style="color: #788ca8;">Unique Id</span>: ${u.numeric_id}</p>
            <p><span style="color: rgb(207, 72, 72);">Full Name</span>: ${u.username}</p>`,
            BeforeBalance,
          txn_amount,
          current_balance,
          created,
          txn_mode,
          u.resp_msg ? u.resp_msg : "No Data Found",
          status_,
        ];
      })
    );

    return res.status(200).send({
      data: await list,
      draw: new Date().getTime(),
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered,
    });
  },

  chipcurculation: async function (req, res) {
    console.log("ajax calll")
//     console.log(req.admin._id ," ---=")
//     var startTime = new Date();

//     const params = req.query;
//     let chip=params.chip
//     // console.log(chip);
//     let matchObj = {};
//     var sortObj = {created_at: -1};

//     const user_id = params.id || "";

//     if (Service.validateObjectId(user_id)) {
//       matchObj.user_id = ObjectId(user_id);
//     }

//     if (!_.isEmpty(params.rank)) {
//       matchObj["users.role"] = params.rank;
//     }
//     let incData=await Service.DownLine(req.admin._id)
// // console.log(req.admin._id)

//     list = await Promise.all(
//       list.map(async (u,index) => {
//     // console.log(u.role,u.transaction_type);
//         let txn_amount = u.txn_amount;

//         if (u.txn_amount > 0) {
//           txn_amount =
//             '<span class="label label-success">' + u.txn_amount + "</span>";
//         } else {
//           txn_amount =
//             '<span class="label label-danger">' + u.txn_amount + "</span>";
//         }
//         let txn_mode = u.transaction_type;
//         // console.log(u.transaction_type === "C");
//         if (u.transaction_type === "C") {
//           txn_mode = '<span class="label label-success">Credit</span>'
//         } 
//         if(u.transaction_type === "D"){
//           txn_mode = '<span class="label label-danger">Debit</span>'
//         }

//         let current_balance= u.current_balance
//         let status_ = u.is_status;
//         // console.log(status_);
//         if (status_ == "P") {
//           status_ = '<span class="label label-warning">Pending</span>';
//         } else if (status_ == "S") {
//           status_ = '<span class="label label-success">Success</span>';
//         } else {
//           status_ = '<span class="label label-danger">Cancled</span>';
//         }

//         let roles=u.role
//         if (roles == "State") {
//           roles = 'State';
//         } 
//         else if (roles == "Zone") {
//           roles = 'Zone';
//         }
//         else if (roles == "District") {
//           roles = 'District';
//         }
//         else if (roles == "Agent") {
//           roles = 'Agent';
//         }
//         let created=await Service.formateDateandTime(u.created_at)
//         let BeforeBalance;

//         if (u.transaction_type == "D") {

//           if(req.admin.role=="Company"){
//             // console.log("admin");
//             if(u.role=="Company"){
//               BeforeBalance=u.current_balance;
//               current_balance= u.current_balance-u.txn_amount;
              
//             }else{
//             // console.log("hi");
//             BeforeBalance=u.current_balance;
//             current_balance= u.current_balance-u.txn_amount;
//           }

//           }else{
//             BeforeBalance=u.current_balance+u.txn_amount;

//           }
//         }  else {
         
//           if(req.admin.role=="Company"){
//             if(u.role=="Company"){
//               BeforeBalance=u.current_balance;
//               current_balance= u.current_balance+u.txn_amount;
//               console.log(BeforeBalance,current_balance,"emasdof");
//             }else{
//               current_balance= u.current_balance+u.txn_amount;
//               BeforeBalance=u.current_balance;
//             }
//           }else{
//             BeforeBalance=u.current_balance-u.txn_amount
//           }

//         }
//         return [
//           ++index,
//           ` <p><span style="color: #788ca8;">Unique Id</span>: ${u.numeric_id}</p>
//             <p><span style="color: rgb(207, 72, 72);">Full Name</span>: ${u.username}</p>`,
//             BeforeBalance,
//           txn_amount,
//           current_balance,
//           created,
//           txn_mode,
//           u.resp_msg ? u.resp_msg : "No Data Found",
//           status_,
//         ];
//       })
//     );

//     return res.status(200).send({
//       data: await list,
//       draw: new Date().getTime(),
//       recordsTotal: recordsTotal,
//       recordsFiltered: recordsFiltered,
//     });
  },

  chipcalclution : async (admin) => {
    // console.log(admin)
    let parentId = String(admin._id);
    let users = await User.find({ parent:parentId })
    .populate({ path: "parent", select: "_id  name  cash_balance search_id role" })
    .select("_id name  cash_balance search_id role");
    return users
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
