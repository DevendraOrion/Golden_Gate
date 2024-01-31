const mongoose = require("mongoose");
const AdminController = require("./adminController");
var path = require("path");
const dotenv = require("dotenv");
var SuperAdmin = require("./../models/superAdmin"),
  Distributor = require("./../models/distributor"),
  UserCommission = require("./../models/userCommission"),
  Agent = require("./../models/agent"),
  Service = require("./../service"),
  config = require("./../../config"),
  { User } = require("./../models/user"),
  { DepositRequests } = require("./../models/depositRequest"),
  { Rank_Data } = require("./../models/rankData"),
   Commission  = require("./../models/commission"),
  { Banners } = require("./../models/banners"),
  { AccessLog } = require("./../models/accessLog"),
  { ProfitPercent } = require("./../models/profitPercent"),
  Table = require("./../models/table"),
  Admin = require("./../models/superAdmin"),
  noticeData = require("./../models/notice-data"),
  _ = require("lodash"),
  localization = require("./../service/localization");
var ObjectId = require("mongoose").Types.ObjectId;
var Mailer = require("./../service/email");
var moment = require("moment-timezone");
var logger = require("./../service/logger");
var IndiaState = require("./../../IndiaState.json");
var bcrypt = require("bcryptjs");
var { WithdrawalRequest } = require("./../models/WithdrawalRequest");
var {
  DistributorWithdrawalRequest,
} = require("./../models/DistributorWithdrawalRequest");
var { AgentWithdrawalRequest } = require("./../models/AgentWithdrawalRequest");
var { Transaction } = require("./../models/transaction");
var { JoinGame } = require("./../models/joinGame");
var { Default } = require("./../models/default");
var { Notification } = require("./../models/notification");
const { Parser } = require("json2csv");
var utility = require("./utilityController");
var fs = require("fs");
const uniqid = require("uniqid");
const PAYTM = require("./../service/paytm/index");
// const { Distributer } = require("./adminPagesController");
module.exports = {
  login: async function (req, res) {
    var params = _.pick(req.body, "email", "password");
    //logger.info('ADMIN LOGIN REQUEST >> ', params);
    if (_.isEmpty(params)) {
      return res
        .status(200)
        .json(Service.response(0, localization.missingParamErrorAdmin, null));
    }
    if (_.isEmpty(params.email) || _.isEmpty(params.password)) {
      return res
        .status(200)
        .json(Service.response(0, localization.missingParamErrorAdmin, null));
    }
    var user = await User.findOne({
      email: params.email,
    });
   
    // console.log(user);
    if (!user)
      return res
        .status(200)
        .json(Service.response(0, localization.invalidCredentials, null));
    var rez1 = await bcrypt.compare(params.password, user.password);
    if (!rez1)
      return res
        .status(200)
        .json(Service.response(0, localization.invalidCredentials, null));
    if (!user.is_active)
      return res
        .status(200)
        .json(Service.response(0, localization.accountDeactivated, null));
    if (user.is_deleted)
      return res
        .status(200)
        .json(Service.response(0, localization.accountDeleted, null));
    var token = await Service.issueToken(params);
    req.session.auth = token;
    req.session.auth.max;
    Age = 36000000;
    user.tokens = [];
    user.tokens.push({
      access: "auth",
      token: token,
    });
    var rez = await user.save();
    if (!rez)
      return res
        .status(200)
        .json(Service.response(0, localization.ServerError, null));
    // ADD ACCESS LOG
    var newLog = new AccessLog({
      admin: user._id,
      action: "Logged into Admin panel",
      created_at: new Date().getTime(),
    });
    await newLog.save();
    return res
      .status(200)
      .json(Service.response(1, localization.loginSuccess, token));
  },
  logout: async (req, res) => {
    try {
      if (req.admin) {
        if (Service.validateObjectId(req.admin._id)) {
          var newLog = new AccessLog({
            admin: req.admin._id,
            action: "Logged out from Admin panel",
            created_at: new Date().getTime(),
          });
          await newLog.save();
        }
      }
      req.session = null;
      return res.send(Service.response(1, localization.success, null));
    } catch (err) {
      console.log("ERR", err);
      return res.send(Service.response(0, localization.ServerError, err));
    }
  },
  withdrawalRequest: async () => {
    const wr = await WithdrawalRequest.find({
      is_status: "P",
    })
      .populate("user_id")
      .sort({
        created_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          request_id: w.request_id,
          username: w.user_id.username,
          numeric_id: w.user_id.numeric_id,
          user_id: w.user_id._id,
          amount: w.amount,
          created_at: w.created_at, //await Service.formateDate(parseInt(w.created_at)),
          completed_at: w.completed_at, //await Service.formateDate(parseInt(w.completed_at)),
          payment_method: _.capitalize(w.payment_type),
          commission: w.commission,
          request_amount: w.request_amount,
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    let total = await WithdrawalRequest.find({
      is_status: "P",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  distWithdrawalRequest: async (req) => {
    const wr = await DistributorWithdrawalRequest.find({
      is_status: "P",
    })
      .populate("distributor_id")
      .sort({
        created_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          name: w.distributor_id.name,
          distributor_id: w.distributor_id._id,
          amount: w.amount,
          created_at: w.created_at,
          completed_at: w.completed_at,
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    let total = await DistributorWithdrawalRequest.find({
      is_status: "P",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  //Get User List
  getNoticeData: async (limit) => {
    //logger.info('ADMIN USER LIST REQUEST >> ');
let list=await noticeData.find({}).sort({created_at:-1}).limit(limit)
    let count = noticeData.length
    return {
      list,
      count,
    };
  },
  getUsersList: async (limit) => {
    //logger.info('ADMIN USER LIST REQUEST >> ');
    const users = await User.aggregate([
      {
        $match: {
          is_deleted: false,
          role: "User"
        }
      },
      {
        $sort: {
          created_at: -1
        }
      }
    ]);
    
    let parentData = await Promise.all(users.map(async (a) => {
      let Data = await User.findOne({ _id: a.parent });
      return {
        ...a,
        parentDatas: Data
      };
    }));
    // console.log(await parentData);
    const list=await parentData
 
    let count = await User.find({
      is_deleted: false,
    }).countDocuments();
    return {
      list,
      count,
    };
  },
  getDepositRequest: async (limit) => {
    const depositRequest = await DepositRequests.aggregate([
      { $match: { is_status: "P" } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "child_id",
          foreignField: "_id",
          as: "child"
        }
      },
      { $unwind: "$user" },
      { $unwind: "$child" },
      {
        $project: {
          user_id: 1,
          showDate: 1,
          txn_amount: 1,
          current_balance: 1,
          txn_id: 1,
          created_at: 1,
          userId: "$user.search_id", // Corrected projection
          childIds: "$child.search_id", // Corrected projection
        }
      }
    ]);
    const list = depositRequest;
    const count = depositRequest.length;
  // console.log(list);
    return {
      list,
      count
    };
  },
  getAgentList: async (role) => {


const users = await User.aggregate([
  {
    $match: {
      is_deleted: false,
      role: { $eq: role }
    }
  },
  {
    $sort: {
      created_at: -1
    }
  }
]);

let parentData = await Promise.all(users.map(async (a) => {
  let state=0
  let district=0
  let zone=0
  let agent=0
  let user=0
  let Data = await User.findOne({ _id: a.parent });
  let childData = await User.find({ parent: a._id });
  if(childData){
    childData.map((child)=>{
      // console.log(child)
      if(child.role==="District"){
        state++
      }
      if(child.role==="District"){
        district++
      }
      if(child.role==="Zone"){
        zone++
      }
      if(child.role==="Agent"){
        agent++
      }
      if(child.role==="User"){
        user++
      }
    })
  }
  return {
    ...a,
    parentDatas: Data,
    childData: childData,
    stateCount:state,
    districtCount:district,
    zoneCount:zone,
    agentCount:agent,
    userCount:user,
  };
}));
// console.log(parentData);

const list=await parentData

    let count = await User.find({
      is_deleted: false,
    }).countDocuments();
    return {
      list,
      count,
    };
  },


  getChildList: async (id) => {

      const users = await User.aggregate([
        {
          $match: {
            is_deleted: false,
            parent:id
          }
        },
        {
          $sort: {
            created_at: -1
          }
        }
      ]);
      let parentData = await Promise.all(users.map(async (a) => {
        let Data = await User.findOne({ _id: a.parent });
        return {
          ...a,
          parentDatas: Data
        };
      }));
      console.log(await parentData);
      const list=await parentData
   
    let count = await User.find({
      is_deleted: false,
    }).countDocuments();
    return {
      list,
      count,
    };
  },


  getUserListAjax: async () => { },
  //Get User Details
  getUserDetails: async (id,admin_id) => {
    // console.log(id,admin_id);
    //logger.info('Admin Request for USER DETAILS ::', id)
    var u = await User.findById(id);
    // console.log(u);
    var gameData = await JoinGame.find(
      {
        user_id: u.numeric_id,
       
      },
      // {
      //   room: 1,
      //   is_active: 1,
      //   room_fee: 1,
      //   no_of_players: 1,
      //   created_at: 1,
      //   "players.$": 1,
      // }
    ).sort({
      created_at: -1,
    });
    // console.log(gameData);
    //logger.info("Game Records::", gameData);
    var gameDataModify = await Promise.all(
      gameData.map(async (k) => {
        return {
          // no_of_players: k.no_of_players,
          amount:k.amount,
          room_fee: k.win_amount-k.amount,
          room: k.room_id,
          created_at: k.created, //await Service.formateDateandTime(parseInt(k.created_at)),
          // players: k.players,
        };
      })
    );
    let userReferredCount = await User.countDocuments({
      "referral.referred_by": u._id,
      is_deleted: false,
    });
    let completedRequest = await WithdrawalRequest.find({
      user_id: id,
      is_status: "A",
    }).sort({
      created_at: -1,
    });
    let completedDeposite = await Transaction.find({
      user_id: id,
      transaction_type: "C",
      is_status: "S",
    }).sort({
      created_at: -1,
    });
    var completedRequestModify = await Promise.all(
      completedRequest.map(async (k) => {
        return {
          amount: k.amount,
          mode: k.payment_type,
          date: k.created_at,
        };
      })
    );
    // let total_withdraw = await WithdrawalRequest.aggregate([
    //     {
    //         $match: {
    //             user_id: ObjectId(id),
    //             is_status: 'A'
    //         }
    //     },
    //     {
    //         $group:{
    //             _id:null,
    //             count:{$sum:'$amount'}
    //         }
    //     }
    // ]);
    // logger.info('total_with', total_withdraw);
    var completedDepositeModify = await Promise.all(
      completedDeposite.map(async (z) => {
        return {
          amount: z.txn_amount,
          mode: z.txn_mode,
          date: z.created_at,
        };
      })
    );
    var newLog = new AccessLog({
      admin: admin_id,
      action: "Viewed user profile in panel",
      user: u._id,
      created_at: new Date().getTime(),
    });
    await newLog.save();
    var list = {
      id: u._id,
      username: u.username,
      profilepic: u.profilepic,
      name: _.capitalize(u.name),
      last_name: _.capitalize(u.last_name),
      numeric_id: u.search_id,
      search_id: u.search_id,
      email: u.email,
      balance: u.cash_balance,
      win: u.win_wallet,
      // mobile: u.mobile_no.country_code + u.mobile_no.number,
      is_active: u.is_active,
      parent: u.parent,
      kyc_status: u.kyc_verified ? u.kyc_verified.status : "unverified",
      referred_users: userReferredCount,
      email_verified: u.email_verified,
      otp_verified: u.otp_verified,
      role: u.role,
      game_data: gameDataModify,
      device_name: u.user_device.name,
      device_model: u.user_device.model,
      device_os: u.user_device.os,
      device_ram: u.user_device.ram,
      device_processor: u.user_device.processor,
      withdrawlCompleted: completedRequestModify,
      completedDeposite: completedDepositeModify,
    };
    return list;
  },
  //Get Count Of All User
  getAllUserCount: async () => {
    //logger.info('ADMIN USER Count REQUEST >> ');
    var c = await User.countDocuments({
      is_deleted: false,
    });
    // console.log(c);
    return c;
  },
  //Get Count Of FB User
  getAllFBUserCount: async () => {
    //logger.info('ADMIN FB USER Count REQUEST >> ');
    const now = new Date();
now.setHours(0, 0, 0, 0);

// console.log(now);
    var c = await User.countDocuments({
      is_deleted: false,
      // is_guest: {
      //   $ne: true,
      // },
      created_at:{
        $gte:now
      }
    });
    return c;
  },
//get all guest users
  getAllGuestUserCount: async () => {
    //logger.info('ADMIN FB USER Count REQUEST >> ');
    var c = await User.countDocuments({
      is_deleted: false,
     role:"Zone"
    });
    return c;
  },
  getTotal_state: async () => {
    //logger.info('ADMIN FB USER Count REQUEST >> ');
    var c = await User.countDocuments({
      is_deleted: false,
     role:"State"
    });
    return c;
  },
  getTotal_district: async () => {
    //logger.info('ADMIN FB USER Count REQUEST >> ');
    var c = await User.countDocuments({
      is_deleted: false,
     role:"District"
    });
    return c;
  },
  getTotal_agent: async () => {
    //logger.info('ADMIN FB USER Count REQUEST >> ');
    var c = await User.countDocuments({
      is_deleted: false,
     role:"Agent"
    });
    return c;
  },
  //Get Count Of Total Game
  getAllGameCount: async () => {
    //logger.info('ADMIN Total Game Count REQUEST >> ');
    // const currentDate = new Date();
    // var c = await Table.countDocuments({
    //   $expr: {
    //     $gte: [
    //       "$created_date",
    //       {
    //         $size: "$players",
    //       },
    //     ],
    //   },
    //   // created_date: { $gt: currentDate.setHours(12, 0, 0, 0) },
    // });
    // return c;
    const now = new Date();
    now.setDate(1);
    
    const timestamp = now.getTime();
    
    // console.log(timestamp);
    
   
    let depo = await Transaction.aggregate([
      {
        $match: {
          transaction_type: "D",
          is_status: "S",
          created_at:{$gte:timestamp.toString()}
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$txn_amount",
          },
        },
      },
    ]);
    // console.log(depo);
    return depo.length > 0 ? depo[0].total || 0 : 0;
  },
  // getAllGameCount: async () => {
  //   const currentDate = new Date();
  //   currentDate.setHours(0, 0, 0, 0);
  //   const count = await Table.countDocuments({
  //     created_date: { $gt: currentDate },
  //   });
  //   return count;
  // },
  //MOST PREFERRED AMOUNT
  // mostPreferredAmount: async () => {
  //   //logger.info('MOST PREFERRED AMOUNT REQUEST >> ');
  //   var data = await Table.aggregate([
  //     {
  //       $group: {
  //         _id: "$room_fee",
  //         count: {
  //           $sum: 1,
  //         },
  //       },
  //     },
  //   ])
  //     .sort({
  //       count: -1,
  //     })
  //     .allowDiskUse(true);
  //   return data.length > 0 ? data[0]._id : 0;
  // },
  mostPreferredAmount: async () => {
    //logger.info('MOST PREFERRED AMOUNT REQUEST >> ');
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const count = await Table.countDocuments({
      created_date: { $gt: currentDate },
    });
    return count;
  },
  //Latest User 8
  latestUser: async () => {
    //logger.info('Latest Users REQUEST >> ');
    var d = await User.find({
      is_deleted: false,
    })
      .sort({
        _id: -1,
      })
      .limit(8);
    var userdata = await Promise.all(
      d.map(async (k) => {
        // console.log(k);
        return {
          username: k.name,
          id: k._id,
          profilepic: k.profile_pic,
          created_at: k.created_at, //await Service.formateDateandTime(parseInt(k.created_at))
        };
      })
    );
    return userdata;
  },
  //Dashboard Chart
  chartData: async () => {
    logger.info("Chart JS REQUEST >> ");
    var d = await Table.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              "$no_of_players",
              {
                $size: "$players",
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$created_date",
            },
            year: {
              $year: "$created_date",
            },
            fee: "$room_fee",
          },
          count: {
            $sum: 1,
          },
        },
      },
      // ,
      // {
      //     $project: {
      //         _id: 1,
      //         count: {
      //             $size: '$transactions'
      //         }
      //     }
      // }
    ])
      .allowDiskUse(true)
      .exec();
    let arr = [];
    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let values = [20, 50, 100, 150, 200, 300, 500, 1000];
    var current_year = new Date().getFullYear();
    var current_month = new Date().getMonth() + 1;
    var mon_year = [];
    while (mon_year.length < 12) {
      for (var i = 0; i < values.length; i++) {
        arr.push({
          year: current_year,
          month: current_month,
          fees: values[i],
          count: 0,
        });
      }
      mon_year.push({
        month: current_month,
        year: current_year,
        readable: months[current_month] + ", " + current_year,
      });
      current_month--;
      if (current_month == 0) {
        current_month = 12;
        current_year--;
      }
    }
    var final_obj = [];
    var sort_mon_year = mon_year.sort(function (a, b) {
      return a["year"] - b["year"] || a["month"] - b["month"];
    });
    for (const v of values) {
      let con_val = [];
      for (const m of sort_mon_year) {
        con_val.push(await Service.getDataChart(d, m.month, m.year, v));
      }
      final_obj.push({
        fees: v,
        values: con_val,
      });
    }
    var modifyData = [];
    var bg = [
      "rgba(51,122,183, 0.2)",
      "rgb(8,146,165, 0.2)",
      "rgb(8,65,92, 0.2)",
      "rgb(204,41,54,0.2)",
      "rgb(235,186,185,0.2)",
      "rgb(181,255,225, 0.2)",
      "rgb(255,189,93, 0.2)",
      "rgb(42,24,46, 0.2)",
    ];
    var border = [
      "#337ab7",
      "#0892A5",
      "#08415C",
      "#CC2936",
      "#EBBAB9",
      "#B5FFE1",
      "#FFBD5D",
      "#2A182E",
    ];
    var i = 0;
    for (const f of final_obj) {
      i++;
      modifyData.push({
        label: "# Fee" + " " + f.fees,
        data: f.values,
        backgroundColor: [bg[i]],
        borderColor: [border[i]],
        borderWidth: 1,
      });
    }
    // '#337ab7'
    var final_mon_year = sort_mon_year.map((d) => {
      return d.readable;
    });
    var final_most_data = {
      data: modifyData,
      legends: final_mon_year,
    };
    return JSON.stringify(final_most_data);
  },
  //Get Count Of Total Deposit
  getDepositCount: async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const timestamp = now.getTime();
    
   
    let depo = await Transaction.aggregate([
      {
        $match: {
          transaction_type: "D",
          is_status: "S",
          created_at:{$gte:timestamp.toString()}
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$txn_amount",
          },
        },
      },
    ]);
    console.log(depo);
    return depo.length > 0 ? depo[0].total || 0 : 0;
    
  },
  //Get Count Of Total WITHDRAWAL
  getWithdrawlCount: async () => {
    const now = new Date();
now.setDate(1);

const timestamp = now.getTime();

    var data = await Transaction.aggregate([
      {
        $match: {
          is_status: "S",
          created_at:{$gte:timestamp.toString()}
        },
      },
      {
        $group: {
          _id: null,
          sum: {
            $sum: "$txn_amount",
          },
        },
      },
    ]).allowDiskUse(true);
    if (data.length > 0) return data[0].sum;
    else return 0;
  },
  getReferralCount: async () => {
    var data = await User.aggregate([
      {
        $match: {
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: null,
          sum: {
            $sum: "$referral.amount",
          },
        },
      },
    ]).allowDiskUse(true);
    if (data.length > 0) return data[0].sum;
    else return 0;
  },
  getReferralList: async () => {
    var users = await User.aggregate([
      {
        $match: {
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: "$referral.referred_by",
          ref: {
            $sum: 1,
          },
          amount: {
            $sum: "$referral.amount",
          },
        },
      },
      {
        $match: {
          _id: {
            $ne: "",
          },
        },
      },
      {
        $sort: {
          ref: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          ref: "$ref",
          // amount: "$amount",
          amount: {
            $divide: [{ $trunc: { $multiply: ["$amount", 100] } }, 100],
          },
        },
      },
    ]).allowDiskUse(true);
    users = await Promise.all(
      users.map(async (user) => {
        user.username = "";
        if (Service.validateObjectId(user.id)) {
          let us = await User.findById(user.id, ["username", "numeric_id"]);
          if (us) {
            user.username = us.username || "";
            user.numeric_id = us.numeric_id;
          }
        }
        return user;
      })
    );
    var users_tot = await User.aggregate([
      {
        $match: {
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: "$referral.referred_by",
          ref: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          _id: {
            $ne: "",
          },
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]).allowDiskUse(true);
    let total = users_tot.length > 0 ? users_tot[0].count : 0;
    logger.info("USERS", users);
    logger.info("TOTAL", total);
    return {
      users,
      total,
    };
  },
  getReferralListAjax: async (req, res) => {
    var startTime = new Date();
    try {
      const params = req.query;
      console.log("AJAX REFERRAL", params);
      var matchObj = {
        _id: {
          $ne: "",
        },
      };
      if (params.search) {
        if (params.search.value.trim() != "") {
          matchObj = {
            $expr: {
              $regexMatch: {
                input: { $toString: "$referrar.numeric_id" },
                regex: params.search.value,
                options: "i",
              },
            },
          };
        }
      }
      var sortObj = {};
      if (params.order) {
        if (params.order[0]) {
          if (params.order[0].column == "0") {
            // SORT BY USERNAME
            sortObj["referrar.username"] =
              params.order[0].dir == "asc" ? 1 : -1;
          } else if (params.order[0].column == "1") {
            // SORT BY REG DATE
            sortObj.ref = params.order[0].dir == "asc" ? 1 : -1;
          } else if (params.order[0].column == "2") {
            // SORT BY REG DATE
            sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
          } else {
            sortObj = {
              ref: -1,
            };
          }
        } else {
          sortObj = {
            ref: -1,
          };
        }
      } else {
        sortObj = {
          ref: -1,
        };
      }
      let aggregate_obj = [
        {
          $match: {
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: "$referral.referred_by",
            ref: {
              $sum: 1,
            },
            amount: {
              $sum: "$referral.amount",
            },
          },
        },
        {
          $match: {
            _id: {
              $ne: "",
            },
          },
        },
        {
          $addFields: {
            _id: {
              $toObjectId: "$_id",
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "referrar",
          },
        },
        {
          $unwind: "$referrar",
        },
        {
          $match: matchObj,
        },
        {
          $sort: sortObj,
        },
        {
          $skip: parseInt(params.start),
        },
        {
          $limit: params.length != -1 ? parseInt(params.length) : 10,
        },
        {
          $project: {
            // _id: 0,
            id: "$_id",
            username: "$referrar.username",
            numeric_id: "$referrar.numeric_id",
            ref: "$ref",
            amount: {
              $divide: [{ $trunc: { $multiply: ["$amount", 100] } }, 100],
            },
            // amount: "$amount",
          },
        },
      ];
      var users = await User.aggregate(aggregate_obj).allowDiskUse(true);
      console.log("USERS", users);
      users = await Promise.all(
        users.map(async (user) => {
          // user.username = "";
          // if (Service.validateObjectId(user.id)) {
          //   let us = await User.findById(user.id, ["username"]);
          //   if (us) user.username = us.username || "";
          // }
          return [
            `<a target="_blank" href="${config.pre + req.headers.host
            }/user/view/${user.id}">${user.numeric_id}</a>`,
            user.ref,
            `<small class="label bg-green">${user.amount}</small>`,
            `<ul class="list-inline">
  						<li>
  							<a href="${config.pre + req.headers.host}/referral/view/${user.id
            }"><i class="fa fa-eye" aria-hidden="true"></i></a>
  						</li>
  					</ul>`,
          ];
        })
      );
      var users_tot = await User.aggregate([
        {
          $match: {
            is_deleted: false,
          },
        },
        {
          $group: {
            _id: "$referral.referred_by",
            ref: {
              $sum: 1,
            },
            amount: {
              $sum: "$referral.amount",
            },
          },
        },
        {
          $match: {
            _id: {
              $ne: "",
            },
          },
        },
        {
          $addFields: {
            _id: {
              $toObjectId: "$_id",
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "referrar",
          },
        },
        {
          $unwind: "$referrar",
        },
        {
          $match: matchObj,
        },
        {
          $group: {
            _id: null,
            count: {
              $sum: 1,
            },
          },
        },
      ]).allowDiskUse(true);
      let total = users_tot.length > 0 ? users_tot[0].count : 0;
      let total_f = total;
      let endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "getReferralListAjax");
      return res.status(200).send({
        data: users,
        draw: new Date().getTime(),
        recordsTotal: total,
        recordsFiltered: total_f,
      });
    } catch (err) {
      console.log("ERRR", err);
      let endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "getUserListAjax");
      return res.send(
        Service.response(0, localization.ServerError, err.message)
      );
    }
  },
  getReferralDetails: async (id, level = 2) => {
    logger.info("Admin Request for REFERRALS DETAILS ::", id);

    const getReferrals = async (referredBy, level) => {
      if (level === 0) {
        return [];
      }
      const matchStage = {
        $match: {
          is_deleted: false,
          "referral.referred_by": referredBy
        }
      };

      const projectStage = {
        $project: {
          name: "$username",
          id: "$_id",
          numeric_id: "$numeric_id",
          matches: "$referral.matches",
          level2_amount: "$level2_amount",
          level1_amount: "$level1_amount",
          // amount: "$referral.amount"
        }
      };
      let addFieldsStage = { $addFields: {} };
      if (level == 2) {
        addFieldsStage = {
          $addFields: {
            level: level,
            amount: "$level2_amount"
          }
        }
      }
      if (level == 1) {
        addFieldsStage = {
          $addFields: {
            level: level,
            amount: "$level1_amount"
          }
        }
      }
      const pipeline = [matchStage, projectStage, addFieldsStage];

      const referrals = await User.aggregate(pipeline).allowDiskUse(true);
      const nestedReferrals = await Promise.all(
        referrals.map(async referral => {
          return await getReferrals(String(referral?.id), level - 1);
        })
      );

      if (nestedReferrals) {
        return referrals.concat(...nestedReferrals);
      }
    };

    const referrals = await getReferrals(id, level);
    return referrals;
  },


  usernameById: async (id) => {
    //logger.info('Admin Request for username ::', id);
    if (Service.validateObjectId(id)) {
      var d = await User.findById({
        _id: id,
      });
      if (d) return d.username;
    }
    return 0;
  },
  /* User Payout Request Process */
  withdrawalRequestProcess: async (req, res, io) => {
    var params = _.pick(req.body, "request_id", "status", "utr_id", "remark");
    //logger.info('ADMIN Withdrawl Accept REQUEST >> ', req.body);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    var checkId = await Service.validateObjectId(params.request_id);
    let updateObject = {
      is_status: params.status,
      completed_at: new Date().getTime(),
    };
    if (params.status == "A") {
      updateObject.utr_id = params.utr_id ?? "";
    }
    if (params.status == "R") {
      updateObject.remark = params.remark ?? "";
    }
    if (checkId) {
      var acceptRequest = await WithdrawalRequest.findByIdAndUpdate(
        params.request_id,
        {
          $set: updateObject,
        }
      );
      if (acceptRequest) {
        if (params.status == "R") {
          //logger.info("Refund Amount to user::", acceptRequest.user_id);
          var checkuserid = await Service.validateObjectId(
            acceptRequest.user_id
          );
          if (checkuserid) {
            User.findByIdAndUpdate(acceptRequest.user_id, {
              $inc: {
                win_wallet: acceptRequest.request_amount,
              },
            })
              .then((d) => {
                //logger.info("Refund Amount Completed");
                let message = {
                  app_id: config.ONESIGNAL_APP_ID,
                  contents: {
                    en: localization.withdrawlPushReject,
                  },
                  data: {
                    method: "message",
                  },
                  include_player_ids: [d.onesignal_id],
                };
                Service.sendNotification(message)
                  .then((data) => {
                    logger.info("Push Sent");
                  })
                  .catch((err) => {
                    logger.info("Push Error ", err);
                  });
                if (d.email) {
                  let emailObjR = {
                    name: d.last_name ? `${d.name} ${d.last_name}` : d.name,
                    email: d.email,
                    amount: acceptRequest.request_amount,
                  };
                  if (d.email_verified) Mailer.sendWithdrawlRejected(emailObjR);
                  else
                    console.log(
                      "CAN't send email cause unverified, sendWithdrawlRejected"
                    );
                }
              })
              .catch((e) => {
                logger.info("Error While Refund Amount ", e);
              });
          } else {
            logger.info("Invalid User ID");
          }
        } else {
          console.log("HERE HERE");
          io.to("panel").emit("withdrawal_updated", {
            amount: acceptRequest.amount,
          });
          let getOnsignalId = await User.findById(acceptRequest.user_id);
          let message = {
            app_id: config.ONESIGNAL_APP_ID,
            contents: {
              en: localization.withdrawlPushSuccess,
            },
            data: {
              method: "message",
            },
            include_player_ids: [getOnsignalId.onesignal_id],
          };
          Service.sendNotification(message)
            .then((data) => {
              logger.info("Push Sent");
            })
            .catch((err) => {
              logger.info("Push Error ", err);
            });
          if (getOnsignalId.email) {
            let emailObj = {
              name: getOnsignalId.last_name
                ? `${getOnsignalId.name} ${getOnsignalId.last_name}`
                : getOnsignalId.name,
              email: getOnsignalId.email,
              amount: acceptRequest.amount,
            };
            Mailer.sendWithdrawlSuccess(emailObj);
          }
        }
        return res.send({
          status: 1,
          Msg: localization.withdrawalRequestProcessed,
        });
      } else {
        return res.send({
          status: 0,
          Msg: localization.ServerError,
        });
      }
    } else {
      return res.send({
        status: 0,
        Msg: localization.invalidRquest,
      });
    }
  },
  withdrawalRequestProcessMultiple: async (req, res, io) => {
    var params = _.pick(req.body, "data", "status");
    logger.info("ADMIN Withdrawl Accept REQUEST >> ", req.body);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    let _ids = _.isArray(params.data) ? params.data : JSON.parse(params.data);
    for (const request_id of _ids) {
      var checkId = await Service.validateObjectId(request_id);
      if (checkId) {
        var acceptRequest = await WithdrawalRequest.findByIdAndUpdate(
          request_id,
          {
            $set: {
              is_status: params.status,
              completed_at: new Date().getTime(),
            },
          }
        );
        if (acceptRequest) {
          if (params.status == "R") {
            //logger.info("Refund Amount to user::", acceptRequest.user_id);
            var checkuserid = await Service.validateObjectId(
              acceptRequest.user_id
            );
            if (checkuserid) {
              User.findByIdAndUpdate(acceptRequest.user_id, {
                $inc: {
                  win_wallet: acceptRequest.request_amount,
                },
              })
                .then((d) => {
                  //logger.info("Refund Amount Completed");
                  let message = {
                    app_id: config.ONESIGNAL_APP_ID,
                    contents: {
                      en: localization.withdrawlPushReject,
                    },
                    data: {
                      method: "message",
                    },
                    include_player_ids: [d.onesignal_id],
                  };
                  Service.sendNotification(message)
                    .then((data) => {
                      logger.info("Push Sent");
                    })
                    .catch((err) => {
                      logger.info("Push Error ", err);
                    });
                  if (d.email) {
                    let emailObjR = {
                      name: d.last_name ? `${d.name} ${d.last_name}` : d.name,
                      email: d.email,
                      amount: acceptRequest.request_amount,
                    };
                    Mailer.sendWithdrawlRejected(emailObjR);
                  }
                })
                .catch((e) => {
                  logger.info("Error While Refund Amount ", e);
                });
            } else {
              logger.info("Invalid User ID");
            }
          } else {
            console.log("HERE HERE", acceptRequest.request_amount);
            io.emit("withdrawal_updated", {
              amount: acceptRequest.request_amount,
            });
            let getOnsignalId = await User.findById(acceptRequest.user_id);
            let message = {
              app_id: config.ONESIGNAL_APP_ID,
              contents: {
                en: localization.withdrawlPushSuccess,
              },
              data: {
                method: "message",
              },
              include_player_ids: [getOnsignalId.onesignal_id],
            };
            Service.sendNotification(message)
              .then((data) => {
                logger.info("Push Sent");
              })
              .catch((err) => {
                logger.info("Push Error ", err);
              });
            if (getOnsignalId.email) {
              let emailObj = {
                name: getOnsignalId.name
                  ? `${getOnsignalId.name} ${getOnsignalId.last_name}`
                  : getOnsignalId.name,
                email: getOnsignalId.email,
                amount: acceptRequest.request_amount,
              };
              Mailer.sendWithdrawlSuccess(emailObj);
            }
          }
        } else {
          return res.send({
            status: 0,
            Msg: localization.ServerError,
          });
        }
      } else {
        return res.send({
          status: 0,
          Msg: localization.invalidRquest,
        });
      }
    }
    return res.send({
      status: 1,
      Msg: localization.withdrawalRequestProcessed,
    });
  },
  /* User Payout Request Process */
  /* Distributor Payout Request Process */
  distWithdrawalRequestProcess: async (req, res, io) => {
    var params = _.pick(req.body, "request_id", "status");
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    var checkId = await Service.validateObjectId(params.request_id);
    if (checkId) {
      var acceptRequest = await DistributorWithdrawalRequest.findByIdAndUpdate(
        params.request_id,
        {
          $set: {
            is_status: params.status,
            completed_at: new Date().getTime(),
          },
        }
      );
      if (acceptRequest) {
        if (params.status == "R") {
          //logger.info("Refund Amount to user::", acceptRequest.distributor_id);
          var checkuserid = await Service.validateObjectId(
            acceptRequest.distributor_id
          );
          if (checkuserid) {
            Distributor.findByIdAndUpdate(acceptRequest.distributor_id, {
              $inc: {
                commission_wallet: acceptRequest.amount,
              },
            })
              .then((d) => {
                //logger.info("Refund Amount Completed");
                /* let message = {
                          app_id: config.ONESIGNAL_APP_ID,
                          contents: {
                            en: localization.withdrawlPushReject
                          },
                          data: {
                            method: 'message'
                          },
                          include_player_ids: [d.onesignal_id]
                        };
                        Service.sendNotification(message)
                          .then(data => {
                            logger.info('Push Sent');
                          })
                          .catch(err => {
                            logger.info('Push Error ', err);
                          }); */
                if (d.email) {
                  let emailObjR = {
                    name: d.name ? `${d.name} ${d.last_name}` : d.name,
                    email: d.email,
                    amount: acceptRequest.amount,
                  };
                  if (d.email_verified) Mailer.sendWithdrawlRejected(emailObjR);
                  else
                    console.log(
                      "Can't send email cause unverified, sendWithdrawlRejected"
                    );
                }
              })
              .catch((e) => {
                logger.info("Error While Refund Amount ", e);
              });
          } else {
            logger.info("Invalid Distributor ID");
          }
        } else {
          console.log("HERE HERE");
          io.to("panel").emit("withdrawal_updated", {
            amount: acceptRequest.amount,
          });
          let distributor = await Distributor.findById(
            acceptRequest.distributor_id
          );
          /* let message = {  
                  app_id: config.ONESIGNAL_APP_ID,
                  contents: {
                    en: localization.withdrawlPushSuccess
                  },
                  data: {
                    method: 'message'
                  },
                  include_player_ids: [getOnsignalId.onesignal_id]
                };
                Service.sendNotification(message)
                  .then(data => {
                    logger.info('Push Sent');
                  })
                  .catch(err => {
                    logger.info('Push Error ', err);
                  }); */
          let emailObj = {
            name: distributor.name,
            email: distributor.email,
            amount: acceptRequest.amount,
          };
          Mailer.sendWithdrawlSuccess(emailObj);
        }
        return res.send({
          status: 1,
          Msg: localization.withdrawalRequestProcessed,
        });
      } else {
        return res.send({
          status: 0,
          Msg: localization.ServerError,
        });
      }
    } else {
      return res.send({
        status: 0,
        Msg: localization.invalidRquest,
      });
    }
  },
  distWithdrawalRequestProcessMultiple: async (req, res, io) => {
    var params = _.pick(req.body, "data", "status");
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    let _ids = _.isArray(params.data) ? params.data : JSON.parse(params.data);
    for (const request_id of _ids) {
      var checkId = await Service.validateObjectId(request_id);
      if (checkId) {
        var acceptRequest =
          await DistributorWithdrawalRequest.findByIdAndUpdate(request_id, {
            $set: {
              is_status: params.status,
              completed_at: new Date().getTime(),
            },
          });
        if (acceptRequest) {
          if (params.status == "R") {
            //logger.info("Refund Amount to user::", acceptRequest.distributor_id);
            var checkuserid = await Service.validateObjectId(
              acceptRequest.distributor_id
            );
            if (checkuserid) {
              Distributor.findByIdAndUpdate(acceptRequest.distributor_id, {
                $inc: {
                  commission_wallet: acceptRequest.amount,
                },
              })
                .then((d) => {
                  //logger.info("Refund Amount Completed");
                  /* let message = {
                              app_id: config.ONESIGNAL_APP_ID,
                              contents: {
                                en: localization.withdrawlPushReject
                              },
                              data: {
                                method: 'message'
                              },
                              include_player_ids: [d.onesignal_id]
                            };
                            Service.sendNotification(message)
                              .then(data => {
                                logger.info('Push Sent');
                              })
                              .catch(err => {
                                logger.info('Push Error ', err);
                              }); */
                  let emailObjR = {
                    name: d.name,
                    email: d.email,
                    amount: acceptRequest.amount,
                  };
                  Mailer.sendWithdrawlRejected(emailObjR);
                })
                .catch((e) => {
                  logger.info("Error While Refund Amount ", e);
                });
            } else {
              logger.info("Invalid User ID");
            }
          } else {
            console.log("HERE HERE", acceptRequest.amount);
            io.emit("withdrawal_updated", {
              amount: acceptRequest.amount,
            });
            let distributor = await Distributor.findById(
              acceptRequest.distributor_id
            );
            /* let message = {
                    app_id: config.ONESIGNAL_APP_ID,
                    contents: {
                      en: localization.withdrawlPushSuccess
                    },
                    data: {
                      method: 'message'
                    },
                    include_player_ids: [getOnsignalId.onesignal_id]
                  };
                  Service.sendNotification(message)
                    .then(data => {
                      logger.info('Push Sent');
                    })
                    .catch(err => {
                      logger.info('Push Error ', err);
                    }); */
            let emailObj = {
              name: distributor.name,
              email: distributor.email,
              amount: acceptRequest.amount,
            };
            Mailer.sendWithdrawlSuccess(emailObj);
          }
        } else {
          return res.send({
            status: 0,
            Msg: localization.ServerError,
          });
        }
      } else {
        return res.send({
          status: 0,
          Msg: localization.invalidRquest,
        });
      }
    }
    return res.send({
      status: 1,
      Msg: localization.withdrawalRequestProcessed,
    });
  },
  /* End Distributor Payout Request Process */
  /* User Payout Completed Request */
  withdrawalCompletedRequest: async () => {
    const wr = await WithdrawalRequest.find({
      is_status: "A",
    })
      .populate("user_id")
      .sort({
        completed_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          request_id: w.request_id,
          username: w.user_id.username,
          numeric_id: w.user_id.numeric_id,
          user_id: w.user_id._id,
          amount: w.amount,
          commission: w.commission,
          request_amount: w.request_amount,
          created_at: w.created_at, //await Service.formateDate(parseInt(w.created_at)),
          completed_at: w.completed_at, //await Service.formateDate(parseInt(w.completed_at)),
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
          utr: w.utr_id,
        };
      })
    );
    //logger.info('Withdrawal List :: ', list);
    let total = await WithdrawalRequest.find({
      is_status: "A",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  withdrawalCompletedAjax: async (req, res) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    console.log("COMPLETED AJAX PARAMS", params);
    let status = "";
    let matchObj = {
      is_status: "A",
    };
    const user_id = params.id || "";
    if (Service.validateObjectId(user_id)) {
      matchObj.user_id = ObjectId(user_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      } else if (params.filter == "U") {
        matchObj.payment_type = "upi";
      }
    }
    let aggregation_obj = [];
    // logger.info("OBJMATCH ", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "3") {
          // SORT BY USERNAME
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY USERNAME
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "6") {
          // SORT BY USERNAME
          sortObj.completed_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
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
        $unwind: "$users",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        request_id: "$request_id",
        username: "$users.username",
        numeric_id: "$users.numeric_id",
        user_id: "$users._id",
        amount: "$amount",
        commission: "$commission",
        request_amount: "$request_amount",
        created_at: "$created_at", //await Service.formateDate(parseInt("$created_at)),
        completed_at: "$completed_at", //await Service.formateDate(parseInt("$completed_at)),
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
        utr_id: "$utr_id",
      },
    });
    // logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await WithdrawalRequest.aggregate(aggregation_obj).allowDiskUse(
      true
    );
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push(
        //     {
        //     $lookup: {
        //         from: 'users',
        //         localField: 'user_id',
        //         foreignField: '_id',
        //         as: 'users'
        //     }
        // },
        // {
        //     $unwind: '$users'
        // },
        {
          $match: matchObj,
        }
      );
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    // logger.info("aggregate_rf", aggregate_rf);
    let rF = await WithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(true);
    // logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await WithdrawalRequest.find({
      is_status: "A",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        //logger.info("User Transaction",u);
        return [
          u._id,
          rank++,
          u.request_id,
          `<a target="_blank" href="/user/view/${u.user_id}">${u.numeric_id}</a>`,
          u.amount,
          u.commission ?? 0,
          u.request_amount ?? 0,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
            u.payment_method
          )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile
          }','${u.upi_id}', '${u.acc_no}', '${u.utr_id
          }')">View</small></a></li></ul>`,
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
  /* End User Payout Completed Request */
  /* Distributor Payout Completed Request */
  distWithdrawalCompletedRequest: async (req) => {
    const wr = await DistributorWithdrawalRequest.find({
      is_status: "A",
    })
      .populate("distributor_id")
      .sort({
        completed_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          name: w.distributor_id.name,
          distributor_id: w.distributor_id._id,
          amount: w.amount,
          created_at: w.created_at,
          completed_at: w.completed_at,
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    let total = await DistributorWithdrawalRequest.find({
      is_status: "A",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  distWithdrawalCompletedAjax: async (req, res, next) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {
      is_status: "A",
    };
    const distributor_id = params.id || "";
    if (Service.validateObjectId(distributor_id)) {
      matchObj.distributor_id = ObjectId(distributor_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      }
    }
    let aggregation_obj = [];
    // logger.info("OBJMATCH ", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "3") {
          // SORT BY AMOUNT
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY CREATED_AT
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "6") {
          // SORT BY COMPLETED_AT
          sortObj.completed_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }
    aggregation_obj.push(
      {
        $lookup: {
          from: "distributors",
          localField: "distributor_id",
          foreignField: "_id",
          as: "distributors",
        },
      },
      {
        $unwind: "$distributors",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        name: "$distributors.name",
        agent_id: "$distributors._id",
        amount: "$amount",
        created_at: "$created_at",
        completed_at: "$completed_at",
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    // logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await DistributorWithdrawalRequest.aggregate(
      aggregation_obj
    ).allowDiskUse(true);
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    // logger.info("aggregate_rf", aggregate_rf);
    let rF = await DistributorWithdrawalRequest.aggregate(
      aggregate_rf
    ).allowDiskUse(true);
    // logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await DistributorWithdrawalRequest.find({
      is_status: "A",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        return [
          u._id,
          rank++,
          u.name,
          u.amount,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
            u.payment_method
          )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile
          }','${u.upi_id}', '${u.acc_no}')">View</small></a></li></ul>`,
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
  /* End Distributor Payout Completed Request */
  withdrawalAjax: async (req, res) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {
      is_status: "P",
    };
    const user_id = params.id || "";
    if (Service.validateObjectId(user_id)) {
      matchObj.user_id = ObjectId(user_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      } else if (params.filter == "U") {
        matchObj.payment_type = "upi";
      }
    }
    let aggregation_obj = [];
    logger.info("OBJMATCH", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "3") {
          // SORT BY USERNAME
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY USERNAME
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
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
        $unwind: "$users",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        request_id: "$request_id",
        username: "$users.username",
        numeric_id: "$users.numeric_id",
        user_id: "$users._id",
        amount: "$amount",
        created_at: "$created_at", //await Service.formateDate(parseInt("$created_at)),
        completed_at: "$completed_at", //await Service.formateDate(parseInt("$completed_at)),
        payment_method: "$payment_type",
        commission: "$commission",
        request_amount: "$request_amount",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await WithdrawalRequest.aggregate(aggregation_obj).allowDiskUse(
      true
    );
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push(
        //     {
        //     $lookup: {
        //         from: 'users',
        //         localField: 'user_id',
        //         foreignField: '_id',
        //         as: 'users'
        //     }
        // },
        // {
        //     $unwind: '$users'
        // },
        {
          $match: matchObj,
        }
      );
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    logger.info("aggregate_rf " + aggregate_rf);
    let rF = await WithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(true);
    logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await WithdrawalRequest.find({
      is_status: "P",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        //logger.info("User Transaction",u);
        return [
          u.id,
          rank++,
          u.request_id,
          `<a target="_blank" href="/user/view/${u.user_id}">${u.numeric_id}</a>`,
          u.amount,
          u.commission ?? 0,
          u.request_amount ?? 0,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<ul class="list-inline">
		  <li>
			<a href="#"><small class="label bg-blue" onclick="showData('${u.payment_method}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile}','${u.upi_id}','${u.acc_no}')">View</small></a>
		  </li>
		  <li>
			<a href="#" data-toggle="modal" data-target="#acceptModal"
      onclick="openModal('${u.id}')"><small class="label bg-green">Accept</small></a>
		  </li>
		  <li>
			<a href="#" onclick="acceptRequest('${u.id}', 'R')"><small class="label bg-red">Reject</small></a>
		  </li>
		</ul>`,
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
  distWithdrawalAjax: async (req, res, next) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {
      is_status: "P",
    };
    const distributor_id = params.id || "";
    if (Service.validateObjectId(distributor_id)) {
      matchObj.distributor_id = ObjectId(distributor_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      }
    }
    let aggregation_obj = [];
    logger.info("OBJMATCH", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "3") {
          // SORT BY AMOUNT
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY CREATED_AT
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }
    aggregation_obj.push(
      {
        $lookup: {
          from: "distributors",
          localField: "distributor_id",
          foreignField: "_id",
          as: "distributors",
        },
      },
      {
        $unwind: "$distributors",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        name: "$distributors.name",
        distributor_id: "$distributors._id",
        amount: "$amount",
        created_at: "$created_at",
        completed_at: "$completed_at",
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await DistributorWithdrawalRequest.aggregate(
      aggregation_obj
    ).allowDiskUse(true);
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    logger.info("aggregate_rf " + aggregate_rf);
    let rF = await DistributorWithdrawalRequest.aggregate(
      aggregate_rf
    ).allowDiskUse(true);
    logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await DistributorWithdrawalRequest.find({
      is_status: "P",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        return [
          u.id,
          rank++,
          u.name,
          u.amount,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue"
  					onclick="showData('${u.payment_method}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile}','${u.upi_id}','${u.acc_no}')">
  					View</small></a>
  				   </li>
  				  <li><a href="#"><small class="label bg-green"onclick="acceptRequest('${u.id}', 'A')">Accept</small></a></li>
  				  <li><a href="#" onclick="acceptRequest('${u.id}', 'R')"><small class="label bg-red">Reject</small></a></li>
  				</ul>`,
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
  /* User Payout Rejected Request */
  withdrawalRejectedRequest: async () => {
    const wr = await WithdrawalRequest.find({
      is_status: "R",
    })
      .populate("user_id")
      .sort({
        completed_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          request_id: w.request_id,
          username: w.user_id.username,
          numeric_id: w.user_id.numeric_id,
          user_id: w.user_id._id,
          amount: w.amount,
          commission: w.commission,
          request_amount: w.request_amount,
          created_at: w.created_at, //await Service.formateDate(parseInt(w.created_at)),
          completed_at: w.completed_at, //await Service.formateDate(parseInt(w.completed_at)),
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    //logger.info('Withdrawal List :: ', list);
    let total = await WithdrawalRequest.find({
      is_status: "R",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  withdrawalRejectedAjax: async (req, res) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {
      is_status: "R",
    };
    const user_id = params.id || "";
    if (Service.validateObjectId(user_id)) {
      matchObj.user_id = ObjectId(user_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      } else if (params.filter == "U") {
        matchObj.payment_type = "upi";
      }
    }
    let aggregation_obj = [];
    logger.info("OBJMATCH", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "2") {
          // SORT BY USERNAME
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "4") {
          // SORT BY USERNAME
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY USERNAME
          sortObj.completed_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
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
        $unwind: "$users",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        request_id: "$request_id",
        username: "$users.username",
        numeric_id: "$users.numeric_id",
        user_id: "$users._id",
        amount: "$amount",
        commission: "$commission",
        request_amount: "$request_amount",
        created_at: "$created_at", //await Service.formateDate(parseInt("$created_at)),
        completed_at: "$completed_at", //await Service.formateDate(parseInt("$completed_at)),
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await WithdrawalRequest.aggregate(aggregation_obj).allowDiskUse(
      true
    );
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push(
        //     {
        //     $lookup: {
        //         from: 'users',
        //         localField: 'user_id',
        //         foreignField: '_id',
        //         as: 'users'
        //     }
        // },
        // {
        //     $unwind: '$users'
        // },
        {
          $match: matchObj,
        }
      );
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    logger.info("aggregate_rf", aggregate_rf);
    let rF = await WithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(true);
    logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await WithdrawalRequest.find({
      is_status: "R",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        //logger.info("User Transaction",u);
        return [
          rank++,
          u.request_id,
          `<a target="_blank" href="/user/view/${u.user_id}">${u.numeric_id}</a>`,
          u.amount,
          u.commission ?? 0,
          u.request_amount ?? 0,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
            u.payment_method
          )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile
          }','${u.upi_id}','${u.acc_no}')">View</small></a></li></ul>`,
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
  /* End User Payout Rejected Request */
  /* Distributor Payout Rejected Request */
  distWithdrawalRejectedRequest: async () => {
    const wr = await DistributorWithdrawalRequest.find({
      is_status: "R",
    })
      .populate("distributor_id")
      .sort({
        completed_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          name: w.distributor_id.name,
          distributor_id: w.distributor_id._id,
          amount: w.amount,
          created_at: w.created_at,
          completed_at: w.completed_at,
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    //logger.info('Withdrawal List :: ', list);
    let total = await DistributorWithdrawalRequest.find({
      is_status: "R",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  distWithdrawalRejectedAjax: async (req, res, next) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {
      is_status: "R",
    };
    const distributor_id = params.id || "";
    if (Service.validateObjectId(distributor_id)) {
      matchObj.distributor_id = ObjectId(distributor_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      }
    }
    let aggregation_obj = [];
    logger.info("OBJMATCH", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "2") {
          // SORT BY AMOUNT
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "4") {
          // SORT BY CREATED_AT
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY COMPLETED_AT
          sortObj.completed_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }
    aggregation_obj.push(
      {
        $lookup: {
          from: "distributors",
          localField: "distributor_id",
          foreignField: "_id",
          as: "distributors",
        },
      },
      {
        $unwind: "$distributors",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        name: "$distributors.name",
        distributor_id: "$distributors._id",
        amount: "$amount",
        created_at: "$created_at",
        completed_at: "$completed_at",
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await DistributorWithdrawalRequest.aggregate(
      aggregation_obj
    ).allowDiskUse(true);
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    logger.info("aggregate_rf", aggregate_rf);
    let rF = await DistributorWithdrawalRequest.aggregate(
      aggregate_rf
    ).allowDiskUse(true);
    logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await DistributorWithdrawalRequest.find({
      is_status: "R",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        //logger.info("User Transaction",u);
        return [
          rank++,
          u.name,
          u.amount,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
            u.payment_method
          )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile
          }','${u.upi_id}','${u.acc_no}')">View</small></a></li></ul>`,
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
  /* End Distributor Payout Rejected Request */
  /* Agent Payout Withdrwal Request */
  agentWithdrawalRequest: async (req) => {
    const wr = await AgentWithdrawalRequest.find({
      is_status: "P",
    })
      .populate("agent_id")
      .sort({
        created_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          username: w.agent_id.username,
          agent_id: w.agent_id._id,
          amount: w.amount,
          created_at: w.created_at,
          completed_at: w.completed_at,
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    let total = await AgentWithdrawalRequest.find({
      is_status: "P",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  agentWithdrawalAjax: async (req, res, next) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {
      is_status: "P",
    };
    const agent_id = params.id || "";
    if (Service.validateObjectId(agent_id)) {
      matchObj.agent_id = ObjectId(agent_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      }
    }
    let aggregation_obj = [];
    logger.info("OBJMATCH", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "3") {
          // SORT BY AMOUNT
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY CREATED_AT
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }
    aggregation_obj.push(
      {
        $lookup: {
          from: "agents",
          localField: "agent_id",
          foreignField: "_id",
          as: "agents",
        },
      },
      {
        $unwind: "$agents",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        username: "$agents.username",
        agent_id: "$agents._id",
        amount: "$amount",
        created_at: "$created_at",
        completed_at: "$completed_at",
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await AgentWithdrawalRequest.aggregate(
      aggregation_obj
    ).allowDiskUse(true);
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    logger.info("aggregate_rf " + aggregate_rf);
    let rF = await AgentWithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(
      true
    );
    logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await AgentWithdrawalRequest.find({
      is_status: "P",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        return [
          u.id,
          rank++,
          `<a target="_blank" href="${config.pre + req.headers.host
          }/agent/view/${u.agent_id}">${u.username}</a>`,
          u.amount,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue"
						onclick="showData('${u.payment_method}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile}','${u.upi_id}','${u.acc_no}')">
						View</small></a>
					   </li>
					  <li><a href="#"><small class="label bg-green"onclick="acceptRequest('${u.id}', 'A')">Accept</small></a></li>
					  <li><a href="#" onclick="acceptRequest('${u.id}', 'R')"><small class="label bg-red">Reject</small></a></li>
					</ul>`,
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
  /* End Agent Payout Withdrwal Request */
  /* Agent Payout Completed Request */
  agentWithdrawalCompleted: async (req) => {
    const wr = await AgentWithdrawalRequest.find({
      is_status: "A",
    })
      .populate("agent_id")
      .sort({
        completed_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          username: w.agent_id.username,
          agent_id: w.agent_id._id,
          amount: w.amount,
          created_at: w.created_at,
          completed_at: w.completed_at,
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    let total = await AgentWithdrawalRequest.find({
      is_status: "A",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  agentWithdrawalCompletedAjax: async (req, res, next) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    console.log("COMPLETED AJAX PARAMS", params);
    let status = "";
    let matchObj = {
      is_status: "A",
    };
    const agent_id = params.id || "";
    if (Service.validateObjectId(agent_id)) {
      matchObj.agent_id = ObjectId(agent_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      }
    }
    let aggregation_obj = [];
    // logger.info("OBJMATCH ", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "3") {
          // SORT BY AMOUNT
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY CREATED_AT
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "6") {
          // SORT BY COMPLETED_AT
          sortObj.completed_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }
    aggregation_obj.push(
      {
        $lookup: {
          from: "agents",
          localField: "agent_id",
          foreignField: "_id",
          as: "agents",
        },
      },
      {
        $unwind: "$agents",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        username: "$agents.username",
        agent_id: "$agents._id",
        amount: "$amount",
        created_at: "$created_at",
        completed_at: "$completed_at",
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    // logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await AgentWithdrawalRequest.aggregate(
      aggregation_obj
    ).allowDiskUse(true);
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    // logger.info("aggregate_rf", aggregate_rf);
    let rF = await AgentWithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(
      true
    );
    // logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await AgentWithdrawalRequest.find({
      is_status: "A",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        return [
          u._id,
          rank++,
          `<a target="_blank" href="${config.pre + req.headers.host
          }/agent/view/${u.agent_id}">${u.username}</a>`,
          u.amount,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
            u.payment_method
          )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile
          }','${u.upi_id}', '${u.acc_no}')">View</small></a></li></ul>`,
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
  /* End Agent Payout Completed Request */
  /* Agent Payout Rejected Request */
  agentWithdrawalRejected: async (req) => {
    const wr = await AgentWithdrawalRequest.find({
      is_status: "R",
    })
      .populate("agent_id")
      .sort({
        completed_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          username: w.agent_id.username,
          agent_id: w.agent_id._id,
          amount: w.amount,
          created_at: w.created_at,
          completed_at: w.completed_at,
          payment_method: _.capitalize(w.payment_type),
          acc_no: w.account_no || "",
          bank_name: w.bank_name || "",
          ifsc: w.ifsc_code || "",
          acc_name: w.account_name || "",
          mobile: w.mobile_no || "",
          upi_id: w.upi_id || "",
        };
      })
    );
    //logger.info('Withdrawal List :: ', list);
    let total = await AgentWithdrawalRequest.find({
      is_status: "R",
    }).countDocuments();
    return {
      list,
      total,
    };
  },
  agentWithdrawalRejectedAjax: async (req, res, next) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {
      is_status: "R",
    };
    const agent_id = params.id || "";
    if (Service.validateObjectId(agent_id)) {
      matchObj.agent_id = ObjectId(agent_id);
    }
    if (params.filter) {
      if (params.filter == "P") {
        matchObj.payment_type = "paytm";
      } else if (params.filter == "B") {
        matchObj.payment_type = "bank";
      }
    }
    let aggregation_obj = [];
    logger.info("OBJMATCH", matchObj);
    aggregation_obj.push({
      $match: matchObj,
    });
    let offset = params.start == "All" ? 0 : parseInt(params.start);
    var sortObj = {};
    if (params.order) {
      if (params.order[0]) {
        if (params.order[0].column == "2") {
          // SORT BY AMOUNT
          sortObj.amount = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "4") {
          // SORT BY CREATED_AT
          sortObj.created_at = params.order[0].dir == "asc" ? 1 : -1;
        } else if (params.order[0].column == "5") {
          // SORT BY COMPLETED_AT
          sortObj.completed_at = params.order[0].dir == "asc" ? 1 : -1;
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
    } else {
      sortObj = {
        created_at: -1,
      };
    }
    aggregation_obj.push(
      {
        $sort: sortObj,
      },
      {
        $skip: offset,
      }
    );
    if (params.length != -1) {
      aggregation_obj.push({
        $limit: parseInt(params.length),
      });
    }
    aggregation_obj.push(
      {
        $lookup: {
          from: "agents",
          localField: "agent_id",
          foreignField: "_id",
          as: "agents",
        },
      },
      {
        $unwind: "$agents",
      }
    );
    aggregation_obj.push({
      $project: {
        id: "$_id",
        username: "$agents.username",
        agent_id: "$agents._id",
        amount: "$amount",
        created_at: "$created_at",
        completed_at: "$completed_at",
        payment_method: "$payment_type",
        acc_no: "$account_no",
        bank_name: "$bank_name",
        ifsc: "$ifsc_code",
        acc_name: "$account_name",
        mobile: "$mobile_no",
        upi_id: "$upi_id",
      },
    });
    logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await AgentWithdrawalRequest.aggregate(
      aggregation_obj
    ).allowDiskUse(true);
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push({
        $match: matchObj,
      });
    }
    aggregate_rf.push({
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    });
    logger.info("aggregate_rf", aggregate_rf);
    let rF = await AgentWithdrawalRequest.aggregate(aggregate_rf).allowDiskUse(
      true
    );
    logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await AgentWithdrawalRequest.find({
      is_status: "R",
    }).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        //logger.info("User Transaction",u);
        return [
          rank++,
          `<a target="_blank" href="${config.pre + req.headers.host
          }/agent/view/${u.agent_id}">${u.username}</a>`,
          u.amount,
          _.capitalize(u.payment_method),
          `<span class='time_formateDateandTime2'>${u.created_at}</span>`,
          `<span class='time_formateDateandTime2'>${u.completed_at}</span>`,
          `<ul class="list-inline"><li><a href="#"><small class="label bg-blue" onclick="showData('${_.capitalize(
            u.payment_method
          )}','${u.amount}', '${u.acc_name}', '${u.bank_name}', '${u.ifsc}', '${u.mobile
          }','${u.upi_id}','${u.acc_no}')">View</small></a></li></ul>`,
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
  /* End Agent Payout Rejected Request */
  /* Agent Payout Request Process */
  agentWithdrawalRequestProcess: async (req, res, io) => {
    var params = _.pick(req.body, "request_id", "status");
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    var checkId = await Service.validateObjectId(params.request_id);
    if (checkId) {
      var acceptRequest = await AgentWithdrawalRequest.findByIdAndUpdate(
        params.request_id,
        {
          $set: {
            is_status: params.status,
            completed_at: new Date().getTime(),
          },
        }
      );
      if (acceptRequest) {
        if (params.status == "R") {
          //logger.info("Refund Amount to user::", acceptRequest.agent_id);
          var checkuserid = await Service.validateObjectId(
            acceptRequest.agent_id
          );
          if (checkuserid) {
            Agent.findByIdAndUpdate(acceptRequest.agent_id, {
              $inc: {
                commission_wallet: acceptRequest.amount,
              },
            })
              .then((d) => {
                //logger.info("Refund Amount Completed");
                let emailObjR = {
                  name: d.name,
                  email: d.email,
                  amount: acceptRequest.amount,
                };
                if (d.email_verified) Mailer.sendWithdrawlRejected(emailObjR);
                else
                  console.log(
                    "Can't send email cause unverified, sendWithdrawlRejected"
                  );
              })
              .catch((e) => {
                logger.info("Error While Refund Amount ", e);
              });
          } else {
            logger.info("Invalid User ID");
          }
        } else {
          console.log("HERE HERE");
          io.to("panel").emit("withdrawal_updated", {
            amount: acceptRequest.amount,
          });
          let agent = await Agent.findById(acceptRequest.agent_id);
          let emailObj = {
            name: agent.name,
            email: agent.email,
            amount: acceptRequest.amount,
          };
          Mailer.sendWithdrawlSuccess(emailObj);
        }
        return res.send({
          status: 1,
          Msg: localization.withdrawalRequestProcessed,
        });
      } else {
        return res.send({
          status: 0,
          Msg: localization.ServerError,
        });
      }
    } else {
      return res.send({
        status: 0,
        Msg: localization.invalidRquest,
      });
    }
  },
  agentWithdrawalRequestProcessMultiple: async (req, res, io) => {
    var params = _.pick(req.body, "data", "status");
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    let _ids = _.isArray(params.data) ? params.data : JSON.parse(params.data);
    for (const request_id of _ids) {
      var checkId = await Service.validateObjectId(request_id);
      if (checkId) {
        var acceptRequest = await AgentWithdrawalRequest.findByIdAndUpdate(
          request_id,
          {
            $set: {
              is_status: params.status,
              completed_at: new Date().getTime(),
            },
          }
        );
        if (acceptRequest) {
          if (params.status == "R") {
            //logger.info("Refund Amount to user::", acceptRequest.agent_id);
            var checkuserid = await Service.validateObjectId(
              acceptRequest.agent_id
            );
            if (checkuserid) {
              Agent.findByIdAndUpdate(acceptRequest.agent_id, {
                $inc: {
                  commission_wallet: acceptRequest.amount,
                },
              })
                .then((d) => {
                  //logger.info("Refund Amount Completed");
                  let emailObjR = {
                    name: d.name,
                    email: d.email,
                    amount: acceptRequest.amount,
                  };
                  Mailer.sendWithdrawlRejected(emailObjR);
                })
                .catch((e) => {
                  logger.info("Error While Refund Amount ", e);
                });
            } else {
              logger.info("Invalid User ID");
            }
          } else {
            console.log("HERE HERE", acceptRequest.amount);
            io.emit("withdrawal_updated", {
              amount: acceptRequest.amount,
            });
            let agent = await Agent.findById(acceptRequest.agent_id);
            let emailObj = {
              name: agent.name,
              email: agent.email,
              amount: acceptRequest.amount,
            };
            Mailer.sendWithdrawlSuccess(emailObj);
          }
        } else {
          return res.send({
            status: 0,
            Msg: localization.ServerError,
          });
        }
      } else {
        return res.send({
          status: 0,
          Msg: localization.invalidRquest,
        });
      }
    }
    return res.send({
      status: 1,
      Msg: localization.withdrawalRequestProcessed,
    });
  },
  /* End Agent Payout Request Process */
  updateAdminProfile: async (req, res) => {
    var params = _.pick(req.body, "name", "email");
    //logger.info("Admin Profile Update Request", params);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.name) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.email) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    var updateAdmin = await Admin.findByIdAndUpdate(req.admin._id, {
      $set: {
        name: params.name,
        email: params.email,
      },
    });
    if (updateAdmin) {
      var newLog = new AccessLog({
        admin: req.admin._id,
        action: "Updated own profile details!",
        created_at: new Date().getTime(),
      });
      await newLog.save();
      return res.send({
        status: 1,
        Msg: localization.loginSuccess,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  updateAdminProfilePass: async (req, res) => {
    var params = _.pick(req.body, "opass", "pass_confirmation", "pass");
    //logger.info("Admin Profile Update Request", params);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.opass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.pass_confirmation) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.pass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (params.pass_confirmation != params.pass) {
      return res.send({
        status: 0,
        Msg: localization.passwordNotMatchError,
      });
    }
    if (
      params.pass_confirmation.trim().length < 6 ||
      params.pass_confirmation.trim().length > 12
    ) {
      return res.send({
        status: 0,
        Msg: localization.passwordValidationError,
      });
    }
    var rez1 = await bcrypt.compare(params.opass, req.admin.password);
    if (!rez1) {
      return res.send({
        status: 0,
        Msg: localization.invalidOldPassError,
      });
    }
    var hash = bcrypt.hashSync(params.pass_confirmation);
    var updateAdmin = await Admin.findByIdAndUpdate(req.admin._id, {
      $set: {
        password: hash,
      },
    });
    if (updateAdmin) {
      var newLog = new AccessLog({
        admin: req.admin._id,
        action: "Changed own password",
        created_at: new Date().getTime(),
      });
      await newLog.save();
      return res.send({
        status: 1,
        Msg: localization.loginSuccess,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  updateUserProfilePass: async (req, res) => {
    var params = _.pick(req.body, "opass", "pass_confirmation", "pass","userName","userId");
    //logger.info("Admin Profile Update Request", params);
    // console.log(params);
    
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
   
    if (!params.pass_confirmation || !params.pass || !params.opass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
   
    if (params.pass_confirmation != params.pass) {
      return res.send({
        status: 0,
        Msg: localization.passwordNotMatchError,
      });
    }
    if (
      params.pass_confirmation.trim().length < 6 ||
      params.pass_confirmation.trim().length > 12
    ) {
      return res.send({
        status: 0,
        Msg: localization.passwordValidationError,
      });
    }
    let user=await User.findOne({search_id:params.userId})
    console.log(req.admin);
    var rez1 = await bcrypt.compare(params.opass, req.admin.security_pin);
    if (!rez1) {
      return res.send({
        status: 0,
        Msg: localization.invalidOldPassError,
      });
    }
    var hash = bcrypt.hashSync(params.pass_confirmation);
    var updateUser = await User.findByIdAndUpdate(user._id, {
      $set: {
        password: hash,
      },
    });
    if (updateUser) {
      var newLog = new AccessLog({
        admin: user._id,
        action: "Changed password of : "+user._id,
        created_at: new Date().getTime(),
      });
      await newLog.save();
      return res.send({
        status: 1,
        Msg: localization.loginSuccess,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  updateUserSP: async (req, res) => {
    var params = _.pick(req.body, "CurrentPass", "SPnpass", "SPcpass","userName","userId");
    console.log(params)
    //logger.info("Admin Profile Update Request", params);
     if (!params) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.CurrentPass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.SPnpass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.SPcpass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (params.SPnpass != params.SPcpass) {
      return res.send({
        status: 0,
        Msg: localization.passwordNotMatchError,
      });
    }
    if (params.SPcpass.length > 5 ||params.SPcpass.length < 3) {
      return res.send({
        status: 0,
        Msg: localization.passwordValidationError2,
      });
    }
    let user=await User.findOne({search_id:params.userId})
    var rez1 = await bcrypt.compare(params.CurrentPass, req.admin.security_pin);
    // console.log(rez1);
    if (!rez1) {
      return res.send({
        status: 0,
        Msg: localization.invalidOldPassError,
      });
    }
    var hash = bcrypt.hashSync(params.SPcpass);
    var updateAdmin = await User.findByIdAndUpdate(user._id, {
      $set: {
        security_pin: hash,
      },
    });
    if (updateAdmin) {
      var newLog = new AccessLog({
        admin: user._id,
        action: "Changed password of :"+user._id,
        created_at: new Date().getTime(),
      });
      await newLog.save();
      return res.send({
        status: 1,
        Msg: localization.loginSuccess,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  updateAdminSP: async (req, res) => {
    var params = _.pick(req.body, "CurrentPass", "SPnpass", "SPcpass");
    //logger.info("Admin Profile Update Request", params);
     if (!params) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.CurrentPass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.SPnpass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (!params.SPcpass) {
      return res.send({
        status: 0,
        Msg: localization.allFiledError,
      });
    }
    if (params.SPnpass != params.SPcpass) {
      return res.send({
        status: 0,
        Msg: localization.passwordNotMatchError,
      });
    }
    if (params.SPcpass.length > 5 ||params.SPcpass.length < 3) {
      return res.send({
        status: 0,
        Msg: localization.passwordValidationError2,
      });
    }
    var rez1 = await bcrypt.compare(params.CurrentPass, req.admin.password);
    // console.log(rez1);
    if (!rez1) {
      return res.send({
        status: 0,
        Msg: localization.invalidOldPassError,
      });
    }
    var hash = bcrypt.hashSync(params.SPcpass);
    var updateAdmin = await User.findByIdAndUpdate(req.admin._id, {
      $set: {
        security_pin: hash,
      },
    });
    if (updateAdmin) {
      var newLog = new AccessLog({
        admin: req.admin._id,
        action: "Changed own password",
        created_at: new Date().getTime(),
      });
      await newLog.save();
      return res.send({
        status: 1,
        Msg: localization.loginSuccess,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  getRanks: async (req, res) => {
   try {
    const rolesData = await Rank_Data.find({}, { rankName: 1, rankId: 1, _id: 0 });
    const roles = {};

    rolesData.forEach(role => {
      roles[parseInt(role.rankId, 10)] = role.rankName;
    });

    const maxIndex = Math.max(...Object.keys(roles).map(Number));
    roles[1] = "Company";
    roles[maxIndex + 1] = "User";
    return ({roles:roles})
   } catch (error) {
    console.log(error);
   }
  },

  
  addMoneyByAdmin: async (req, res) => {
    var params = _.pick(
      req.body,
      "request_id",
      "amount",
      "type",
      "txn_mode",
      "remarks"
    );
    logger.info("Add Money Request", params);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.request_id) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.amount) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (isNaN(params.amount)) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (params.amount <= 0) {
      return res.send({
        status: 0,
        Msg: localization.invalidAmountError,
      });
    }
    var checkId = await Service.validateObjectId(params.request_id);
    let obj = {};
    if (params.type == "win") {
      obj.cash_balance = params.amount;
    } else if (params.type == "main") {
      obj.cash_balance = params.amount;
    } else {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (checkId) {
      var addedAmount = await User.findByIdAndUpdate(params.request_id, {
        $inc: obj,
      });
      if (addedAmount) {
        logger.info("NUmeric ID", addedAmount);
        // var maxNumId = await Transaction.find({}, 'order_id')
        //     .sort({ order_id: -1 })
        //     .limit(1);
        // var order_id = maxNumId.length == 0 ? 10000 : 0;
        // if (order_id == 0) {
        //     order_id = maxNumId[0].order_id + 1;
        //     maxNumId = await Transaction.findOne({ order_id: order_id });
        //     while (maxNumId) {
        //         order_id = maxNumId.order_id + 1;
        //         maxNumId = await Transaction.findOne({ order_id: order_id });
        //     }
        // }
        // var a = uniqid();
        // var b = addedAmount.numeric_id;
        var order_id = utility.objectId();
        //var order_id = `${b}${a}`;
        // var order_id = uniqid();
        logger.info("Order Id while money deduct:: ", order_id);
        var newTxn = new Transaction({
          user_id: params.request_id,
          txn_amount: params.amount,
          order_id: order_id,
          created_at: new Date().getTime(),
          transaction_type: "C",
          resp_msg: params.remarks || "Deposit by Admin",
          is_status: "S",
          txn_mode: params.txn_mode,
        });
        if (params.type == "main") {
          newTxn.txn_win_amount = 0;
          newTxn.txn_main_amount = params.amount;
        } else {
          newTxn.txn_win_amount = params.amount;
          newTxn.txn_main_amount = 0;
        }
        let txnres = await newTxn.save();
        if (txnres) {
          //logger.info("record::", addedAmount);
          let message = {
            app_id: config.ONESIGNAL_APP_ID,
            contents: {
              en:
                localization.adminAmountPushSuccess +
                " " +
                params.amount +
                " Rs",
            },
            data: {
              method: "message",
            },
            include_player_ids: [addedAmount.onesignal_id],
          };
          Service.sendNotification(message)
            .then((data) => {
              logger.info("Push Sent");
            })
            .catch((err) => {
              logger.info("Push Error ", err);
            });
          var newLog = new AccessLog({
            admin: req.admin._id,
            action: `Added ${params.amount} in user's ${params.type} wallet`,
            user: params.request_id,
            created_at: new Date().getTime(),
          });
          await newLog.save();
          return res.send({
            status: 1,
            Msg: localization.addmoneyRequestProcessed,
          });
        } else {
          return res.send({
            status: 0,
            Msg: localization.ServerError,
          });
        }
      } else {
        return res.send({
          status: 0,
          Msg: localization.ServerError,
        });
      }
    } else {
      return res.send({
        status: 0,
        Msg: localization.invalidRquest,
      });
    }
  },
  deductMoneyByAdmin: async (req, res) => {
    var params = _.pick(req.body, "request_id", "amount", "type", "remarks");
    //logger.info("Add Money Request", params);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.request_id) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.amount) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (isNaN(params.amount)) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (params.amount <= 0) {
      return res.send({
        status: 0,
        Msg: localization.invalidAmountError,
      });
    }
    var checkId = await Service.validateObjectId(params.request_id);
    let obj = {};
    var user = await User.findById(params.request_id);
    if (!user)
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    if (params.type == "win") {
      obj.win_wallet = 0 - params.amount;
      if (params.amount > user.win_wallet) {
        return res.send({
          status: 0,
          Msg: localization.notEnoughAmount,
        });
      }
    } else if (params.type == "main") {
      obj.cash_balance = 0 - params.amount;
      console.log(params.amount,user.balance);
      if (params.amount > user.cash_balance) {
        return res.send({
          status: 0,
          Msg: localization.notEnoughAmount,
        });
      }
    } else {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (checkId) {
      var addedAmount = await User.findByIdAndUpdate(params.request_id, {
        $inc: obj,
      });
      if (addedAmount) {
        // var maxNumId = await Transaction.find({}, 'order_id')
        //     .sort({ order_id: -1 })
        //     .limit(1);
        // var order_id = maxNumId.length == 0 ? 10000 : 0;
        // if (order_id == 0) {
        //     order_id = maxNumId[0].order_id + 1;
        //     maxNumId = await Transaction.findOne({ order_id: order_id });
        //     while (maxNumId) {
        //         order_id = maxNumId.order_id + 1;
        //         maxNumId = await Transaction.findOne({ order_id: order_id });
        //     }
        // }
        // var a = uniqid();
        // var b = addedAmount.numeric_id;
        var order_id = utility.objectId();
        // var order_id = `${b}${a}`;
        logger.info("Order Id while money deduct:: ", order_id);
        var newTxn = new Transaction({
          user_id: params.request_id,
          txn_amount: 0 - params.amount,
          order_id: order_id,
          created_at: new Date().getTime(),
          transaction_type: "D",
          resp_msg: params.remarks || "Deduct by admin",
          is_status: "S",
          txn_mode: "A",
        });
        if (params.type == "main") {
          newTxn.txn_win_amount = 0;
          newTxn.txn_main_amount = 0 - params.amount;
        } else {
          newTxn.txn_win_amount = 0 - params.amount;
          newTxn.txn_main_amount = 0;
        }
        let txnres = await newTxn.save();
        if (txnres) {
          var newLog = new AccessLog({
            admin: req.admin._id,
            action: `Deducted ${params.amount} from user's ${params.type} wallet`,
            user: params.request_id,
            created_at: new Date().getTime(),
          });
          await newLog.save();
          return res.send({
            status: 1,
            Msg: localization.addmoneyRequestProcessed,
          });
        } else {
          return res.send({
            status: 0,
            Msg: localization.ServerError,
          });
        }
      } else {
        return res.send({
          status: 0,
          Msg: localization.ServerError,
        });
      }
    } else {
      return res.send({
        status: 0,
        Msg: localization.invalidRquest,
      });
    }
  },
  getAppVersion: async (req, res) => {
    var version = await Default.findOne({
      key: "app_version",
    });
    if (version) return version;
    else {
      return false;
    }
  },
  getNotification: async (limit) => {
    //logger.info('ADMIN USER LIST REQUEST >> ');
    const notifications = await Notification.find({})
      .sort({
        created_at: -1,
      })
      .limit(limit);
    const list = await Promise.all(
      notifications.map(async (u) => {
        return {
          id: u._id,
          notice_title: u.notice_title,
          notice_date: u.notice_date,
          content: u.content,
          status: u.status,
          created_at: u.created_at,
        };
      })
    );
    let count = await User.find({
      is_deleted: false,
    }).countDocuments();
    return {
      list,
      count,
    };
  },
  getNotificationListAjax: async (req, res) => {
    var startTime = new Date();
    try {
      const params = req.query;
      //logger.info(params.search.value)
      let obj = {};
      if (params.search) {
        if (params.search.value.trim() != "") {
          obj["$or"] = [];
        }
      }
      var sortObj = {};
      if (params.order) {
        if (params.order[0]) {
          if (params.order[0].column == "0") {
            // SORT BY USERNAME
            sortObj.username = params.order[0].dir == "asc" ? 1 : -1;
          } else if (params.order[0].column == "2") {
            // SORT BY REG DATE
            sortObj.games_played = params.order[0].dir == "asc" ? 1 : -1;
          } else if (params.order[0].column == "3") {
            // SORT BY REG DATE
            sortObj.main_wallet = params.order[0].dir == "asc" ? 1 : -1;
          } else if (params.order[0].column == "4") {
            // SORT BY REG DATE
            sortObj.win_wallet = params.order[0].dir == "asc" ? 1 : -1;
          } else {
            sortObj = {
              created_at: -1,
            };
          }
        } else {
          sortObj = {
            created_at: -1,
          };
        }
      } else {
        sortObj = {
          created_at: -1,
        };
      }
      //logger.info('Object to Search :: ', obj);
      // let list = await User.find(obj)
      //     .sort(sortObj)
      //     .skip(parseInt(params.start))
      //     .limit(params.length == -1 ? '' : parseInt(params.length));
      let list = await Notification.aggregate([
        {
          $match: obj,
        },
        {
          $sort: sortObj,
        },
        {
          $limit: params.length == -1 ? "" : parseInt(params.length),
        },
      ]).allowDiskUse(true);
      list = await Promise.all(
        list.map(async (u) => {
          var color = u.status === "active" ? "btn-success" : "btn-danger";
          var status = u.status === "active" ? "inactive" : "active";
          return [
            u.notice_title,
            u.content,
            u.notice_date,
            u.status[0].toUpperCase() + u.status.slice(1),
            `<button
                      type="button"
                      class="btn btn-warning btn-sm notificationEdit"
                      data-toggle="modal"
                      data-target="#addModal"
                      data-id="${u._id}"
                    >
                      Edit
                    </button>
                    <button class="btn btn-sm ${color} notificationstatus" data-id="${u._id
            }" data-status="${status}">
            <small class="label">${u.status[0].toUpperCase() + u.status.slice(1)
            }</small>
          </button>
          `,
          ];
        })
      );
      let total = await Notification.find().countDocuments();
      let total_f = await Notification.find(obj).countDocuments();
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "getUserListAjax");
      return res.status(200).send({
        data: list,
        draw: new Date().getTime(),
        recordsTotal: total,
        recordsFiltered: total_f,
      });
    } catch (err) {
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "getUserListAjax");
      return res.send(
        Service.response(0, localization.ServerError, err.message)
      );
    }
  },
  addNotification: async (req, res) => {
    var params = _.pick(
      req.body,
      "id",
      "notice_title",
      "notice_date",
      "content"
    );
    //logger.info('ADMIN LOGIN REQUEST >> ', params);
    if (_.isEmpty(params)) {
      return res
        .status(200)
        .json(Service.response(0, localization.missingParamErrorAdmin, null));
    }
    if (
      _.isEmpty(params.notice_title) ||
      _.isEmpty(params.notice_date) ||
      _.isEmpty(params.content)
    ) {
      return res
        .status(200)
        .json(Service.response(0, localization.missingParamErrorAdmin, null));
    }
    if (!params.id) {
      var newLog = new Notification({
        notice_title: params.notice_title,
        notice_date: params.notice_date,
        content: params.content,
        status: "active",
        created_at: new Date().getTime(),
      });
      var rez = await newLog.save();
    } else {
      var rez = await Notification.findOneAndUpdate(
        {
          _id: params.id,
        },
        {
          $set: {
            notice_title: params.notice_title,
            notice_date: params.notice_date,
            content: params.content,
          },
        }
      );
    }
    if (!rez)
      return res
        .status(200)
        .json(Service.response(0, localization.ServerError, null));
    return res
      .status(200)
      .json(
        Service.response(
          1,
          localization.addNotificationSuccess,
          "successfully added"
        )
      );
  },
  getOneNotification: async function (req, res) {
    var startTime = new Date();
    var params = _.pick(req.body, ["id"]);
    //logger.info("PARAMS", params);
    if (!params)
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    if (!Service.validateObjectId(params.id)) {
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    }
    var rez = await Notification.findById(params.id, {});
    var endTime = new Date();
    utility.logElapsedTime(req, startTime, endTime, "getOneNotification");
    if (rez) {
      return res.send(Service.response(1, localization.success, rez));
    } else return res.send(Service.response(0, localization.serverError, null));
  },
  updateNotificationStatus: async function (req, res) {
    var startTime = new Date();
    var params = _.pick(req.body, ["id", "status"]);
    //logger.info("PARAMS", params);
    if (!params)
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    if (!Service.validateObjectId(params.id)) {
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    }
    var rez = await Notification.findByIdAndUpdate(params.id, {
      $set: {
        status: params.status,
      },
    });
    var endTime = new Date();
    utility.logElapsedTime(req, startTime, endTime, "updateStatus");
    if (rez) {
      return res.send(Service.response(1, localization.success, null));
    } else return res.send(Service.response(0, localization.serverError, null));
  },
  generateReport: async (req, res) => {
    // logger.info("GENERATE REPORT STARTED", req.body);
    try {
      let dates = req.body.date.split(" - ");
      let start_date_ = dates[0].split("/").reverse().join("-") + " 00:00:00";
      let end_date_ = dates[1].split("/").reverse().join("-") + " 23:59:59";
      let start_date = moment
        .tz(start_date_, "Asia/Kolkata")
        // .format('YYYY-MM-DD HH:mm:ss.sssZ');
        .format("x");
      let end_date = moment
        .tz(end_date_, "Asia/Kolkata")
        // .format('YYYY-MM-DD HH:mm:ss.sssZ');
        .format("x");
      // let start_date = "2019-06-26";
      // let end_date = "2019-07-15";
      // logger.info("BEFORE QUERY", new Date(), start_date, end_date);
      // let b = await Table.find({
      //     game_completed_at: {
      //         $ne: '-1'
      //     },
      //     created_at: {
      //         $gte: parseInt(start_date),
      //         $lte: parseInt(end_date)
      //     }
      // });
      let count = await Table.find({
        game_completed_at: {
          $ne: "-1",
        },
        created_at: {
          $gte: parseInt(start_date),
          $lte: parseInt(end_date),
        },
      }).countDocuments();
      // logger.info("COUNT", count);
      let d = await Table.aggregate([
        {
          $match: {
            game_completed_at: {
              $ne: "-1",
            },
            created_at: {
              $gte: parseInt(start_date),
              $lte: parseInt(end_date),
            },
          },
        },
        {
          $unwind: "$players",
        },
        {
          $lookup: {
            from: "users",
            localField: "players.id",
            foreignField: "_id",
            as: "players.id",
          },
        },
        {
          $unwind: "$players.id",
        },
        {
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
            room_fee: {
              $first: "$room_fee",
            },
            created_at: {
              $first: "$created_at",
            },
            created_date: {
              $first: "$created_date",
            },
            players: {
              $push: "$players",
            },
          },
        },
        {
          $sort: {
            created_at: 1,
          },
        },
      ]).allowDiskUse(true);
      // logger.info('DATA', d.length, b.length);
      // logger.info("BEFORE MAP", new Date());
      var gData = await Promise.all(
        d.map(async (u) => {
          let remark =
            "User".padEnd(15) +
            "\t" +
            "Rank".padEnd(6) +
            "\t" +
            "PL".padEnd(8) +
            "\n";
          for (const us of u.players) {
            remark +=
              us.id.username.padEnd(15) +
              "\t" +
              us.rank.toString().padEnd(6) +
              "\t" +
              us.pl.toString().padEnd(8) +
              "\n";
          }
          return {
            "Room Code": u.room,
            "Room Type": u.room_type,
            "No Of Players": u.no_of_players,
            "Total Amount": u.room_fee,
            "Date Time": Service.formateDateandTime(u.created_at),
            Remark: remark, //players
            // 'TS':u.created_at
          };
        })
      );
      const fields = [
        "Room Code",
        "Room Type",
        "No Of Players",
        "Total Amount",
        "Date Time",
        "Remark",
      ];
      // logger.info("BEFORE PARSE", new Date());
      const json2csvParser = new Parser({
        fields,
      });
      const csv = json2csvParser.parse(gData);
      // logger.info("AFTER PARSE", new Date());
      // logger.info(csv);
      return res.send({
        status: 1,
        file_name: "Report_" + start_date_ + " TO " + end_date_ + ".csv",
        data: csv,
      });
    } catch (err) {
      logger.info("ERR", err);
      return res.send({
        status: 0,
        message: "Something is wrong, Please try again",
        error: err,
      });
    }
  },
  /* User Payout Export */
  exportWithdrawal: async (req, res) => {
    logger.info("export_withdrawal_request STARTED", req.body);
    try {
      let bank_match = {
        is_status: "P",
        payment_type: "bank",
      };
      let paytm_match = {
        is_status: "P",
        payment_type: "paytm",
      };
      let phonepe_match = {
        is_status: "P",
        payment_type: "phonepe",
      };
      let google_pay_match = {
        is_status: "P",
        payment_type: "google_pay",
      };
      if (req.body.data) {
        let _ids = _.isArray(req.body.data)
          ? req.body.data
          : JSON.parse(req.body.data);
        let final_ids = [];
        for (const id of _ids) {
          if (!Service.validateObjectId(id)) {
            return res.send({
              status: 0,
              Msg: localization.ServerError,
            });
          } else {
            final_ids.push(ObjectId(id));
          }
        }
        bank_match._id = {
          $in: final_ids,
        };
        paytm_match._id = {
          $in: final_ids,
        };
        phonepe_match._id = {
          $in: final_ids,
        };
        google_pay_match._id = {
          $in: final_ids,
        };
      }
      logger.info(
        "DATA",
        bank_match,
        paytm_match,
        phonepe_match,
        google_pay_match
      );
      let bank_data = await WithdrawalRequest.aggregate([
        {
          $match: bank_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            // "A/C Holder Name": "$user.username",
            "#A/C Number": {
              $concat: ["#", "$account_no"],
            }, // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
            IFSC: "$ifsc_code",
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Remarks (optional)": {
              $concat: [
                "$user.username",
                "--",
                {
                  $toString: "$_id",
                },
              ],
            },
          },
        },
      ]).allowDiskUse(true);
      logger.info("BANK DATA", bank_data);
      const bank_fields = [
        "#A/C Number",
        "IFSC",
        "Amount",
        "Remarks (optional)",
      ];
      const bankParser = new Parser({
        bank_fields,
      });
      const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : "";
      let paytm_data = await WithdrawalRequest.aggregate([
        {
          $match: paytm_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            "User's Mobile Number/Email": "$mobile_no", // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Beneficiary Name": "$user.username",
            Comment: "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PAYTM DATA", paytm_data);
      const paytm_fields = [
        "User's Mobile Number/Email",
        "Amount",
        "Beneficiary Name",
        "Comment",
      ];
      const paytmParser = new Parser({
        paytm_fields,
      });
      const csv_paytm =
        paytm_data.length > 0 ? paytmParser.parse(paytm_data) : "";
      // logger.info(csv);
      let phonepe_data = await WithdrawalRequest.aggregate([
        {
          $match: phonepe_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            Name: "$user.username",
            "Mobile Number": "$mobile_no",
            "UPI ID": "$upi_id",
            Amount: "$amount",
            "Remarks (optional)": "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PHONEPE DATA", phonepe_data);
      const phonepe_fields = [
        "Name",
        "Mobile Number",
        "UPI ID",
        "Amount",
        "Remarks (optional)",
      ];
      const phonepeParser = new Parser({
        phonepe_fields,
      });
      const csv_phonepe =
        phonepe_data.length > 0 ? phonepeParser.parse(phonepe_data) : "";
      let googlepay_data = await WithdrawalRequest.aggregate([
        {
          $match: google_pay_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            Name: "$user.username",
            "Mobile Number": "$mobile_no",
            "UPI ID": "$upi_id",
            Amount: "$amount",
            "Remarks (optional)": "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("GOOGLEPAY DATA", googlepay_data);
      const googlepay_fields = [
        "Name",
        "Mobile Number",
        "UPI ID",
        "Amount",
        "Remarks (optional)",
      ];
      const googlepayParser = new Parser({
        googlepay_fields,
      });
      const csv_googlepay =
        googlepay_data.length > 0 ? googlepayParser.parse(googlepay_data) : "";
      let files = [];
      let d = new Date();
      d = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
      if (csv_paytm != "") {
        files.push({
          file_name: "Paytm_Requests_" + d + ".csv",
          data: csv_paytm,
          type: "LC_PTM_",
        });
      }
      if (csv_bank != "") {
        files.push({
          file_name: "Bank_Requests_" + d + ".csv",
          data: csv_bank,
          type: "LC_BNK_",
        });
      }
      if (csv_phonepe != "") {
        files.push({
          file_name: "PhonePe_Requests_" + d + ".csv",
          data: csv_phonepe,
          type: "LC_PHN_",
        });
      }
      if (csv_googlepay != "") {
        files.push({
          file_name: "GooglePay_Requests_" + d + ".csv",
          data: csv_googlepay,
          type: "LC_GPY_",
        });
      }
      return res.send({
        status: 1,
        files: files,
      });
    } catch (err) {
      logger.info("ERR", err);
      return res.send({
        status: 0,
        message: "Something is wrong, Please try again",
        error: err,
      });
    }
  },
  exportCompleted: async (req, res) => {
    logger.info("exportCompleted_request STARTED", req.body);
    try {
      let bank_match = {
        is_status: "A",
        payment_type: "bank",
      };
      let paytm_match = {
        is_status: "A",
        payment_type: "paytm",
      };
      let phonepe_match = {
        is_status: "A",
        payment_type: "phonepe",
      };
      let google_pay_match = {
        is_status: "A",
        payment_type: "google_pay",
      };
      if (req.body.data) {
        let _ids = _.isArray(req.body.data)
          ? req.body.data
          : JSON.parse(req.body.data);
        let final_ids = [];
        for (const id of _ids) {
          if (!Service.validateObjectId(id)) {
            return res.send({
              status: 0,
              Msg: localization.ServerError,
            });
          } else {
            final_ids.push(ObjectId(id));
          }
        }
        bank_match._id = {
          $in: final_ids,
        };
        paytm_match._id = {
          $in: final_ids,
        };
        phonepe_match._id = {
          $in: final_ids,
        };
        google_pay_match._id = {
          $in: final_ids,
        };
      }
      logger.info(
        "DATA",
        bank_match,
        paytm_match,
        phonepe_match,
        google_pay_match
      );
      let bank_data = await WithdrawalRequest.aggregate([
        {
          $match: bank_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            "A/C Holder Name": "$user.username",
            "A/C Number": "$account_no", // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
            IFSC: "$ifsc_code",
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Remarks (optional)": "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("BANK DATA", bank_data);
      const bank_fields = [
        "A/C Holder Name",
        "A/C Number",
        "IFSC",
        "Amount",
        "Remarks (optional)",
      ];
      const bankParser = new Parser({
        bank_fields,
      });
      const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : "";
      let paytm_data = await WithdrawalRequest.aggregate([
        {
          $match: paytm_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            "User's Mobile Number/Email": "$mobile_no", // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Beneficiary Name": "$user.username",
            Comment: "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PAYTM DATA", paytm_data);
      const paytm_fields = [
        "User's Mobile Number/Email",
        "Amount",
        "Beneficiary Name",
        "Comment",
      ];
      const paytmParser = new Parser({
        paytm_fields,
      });
      const csv_paytm =
        paytm_data.length > 0 ? paytmParser.parse(paytm_data) : "";
      // logger.info(csv);
      let phonepe_data = await WithdrawalRequest.aggregate([
        {
          $match: phonepe_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            Name: "$user.username",
            "Mobile Number": "$mobile_no",
            "UPI ID": "$upi_id",
            Amount: "$amount",
            "Remarks (optional)": "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PHONEPE DATA", phonepe_data);
      const phonepe_fields = [
        "Name",
        "Mobile Number",
        "UPI ID",
        "Amount",
        "Remarks (optional)",
      ];
      const phonepeParser = new Parser({
        phonepe_fields,
      });
      const csv_phonepe =
        phonepe_data.length > 0 ? phonepeParser.parse(phonepe_data) : "";
      let googlepay_data = await WithdrawalRequest.aggregate([
        {
          $match: google_pay_match,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            Name: "$user.username",
            "Mobile Number": "$mobile_no",
            "UPI ID": "$upi_id",
            Amount: "$amount",
            "Remarks (optional)": "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("GOOGLEPAY DATA", googlepay_data);
      const googlepay_fields = [
        "Name",
        "Mobile Number",
        "UPI ID",
        "Amount",
        "Remarks (optional)",
      ];
      const googlepayParser = new Parser({
        googlepay_fields,
      });
      const csv_googlepay =
        googlepay_data.length > 0 ? googlepayParser.parse(googlepay_data) : "";
      let files = [];
      let d = new Date();
      d = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
      if (csv_paytm != "") {
        files.push({
          file_name: "Paytm_Requests_" + d + ".csv",
          data: csv_paytm,
          type: "LC_PTM_",
        });
      }
      if (csv_bank != "") {
        files.push({
          file_name: "Bank_Requests_" + d + ".csv",
          data: csv_bank,
          type: "LC_BNK_",
        });
      }
      if (csv_phonepe != "") {
        files.push({
          file_name: "PhonePe_Requests_" + d + ".csv",
          data: csv_phonepe,
          type: "LC_PHN_",
        });
      }
      if (csv_googlepay != "") {
        files.push({
          file_name: "GooglePay_Requests_" + d + ".csv",
          data: csv_googlepay,
          type: "LC_GPY_",
        });
      }
      return res.send({
        status: 1,
        files: files,
      });
    } catch (err) {
      logger.info("ERR", err);
      return res.send({
        status: 0,
        message: "Something is wrong, Please try again",
        error: err,
      });
    }
  },
  /* End User Payout Export */
  /* Distributor Payout Export */
  distExportWithdrawal: async (req, res, next) => {
    logger.info("export_dist_withdrawal_request STARTED", req.body);
    try {
      let bank_match = {
        is_status: "P",
        payment_type: "bank",
      };
      let paytm_match = {
        is_status: "P",
        payment_type: "paytm",
      };
      if (req.body.data) {
        let _ids = _.isArray(req.body.data)
          ? req.body.data
          : JSON.parse(req.body.data);
        let final_ids = [];
        for (const id of _ids) {
          if (!Service.validateObjectId(id)) {
            return res.send({
              status: 0,
              Msg: localization.ServerError,
            });
          } else {
            final_ids.push(ObjectId(id));
          }
        }
        bank_match._id = {
          $in: final_ids,
        };
        paytm_match._id = {
          $in: final_ids,
        };
      }
      logger.info("DATA", bank_match, paytm_match); // phonepe_match, google_pay_match
      let bank_data = await DistributorWithdrawalRequest.aggregate([
        {
          $match: bank_match,
        },
        {
          $lookup: {
            from: "distributors",
            localField: "distributor_id",
            foreignField: "_id",
            as: "distributors",
          },
        },
        {
          $unwind: "$distributors",
        },
        {
          $project: {
            _id: 0,
            "#A/C Number": {
              $concat: ["#", "$account_no"],
            }, // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
            IFSC: "$ifsc_code",
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Remarks (optional)": {
              $concat: [
                "$distributors.name",
                "--",
                {
                  $toString: "$_id",
                },
              ],
            },
          },
        },
      ]).allowDiskUse(true);
      logger.info("BANK DATA", bank_data);
      const bank_fields = [
        "#A/C Number",
        "IFSC",
        "Amount",
        "Remarks (optional)",
      ];
      const bankParser = new Parser({
        bank_fields,
      });
      const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : "";
      let paytm_data = await DistributorWithdrawalRequest.aggregate([
        {
          $match: paytm_match,
        },
        {
          $lookup: {
            from: "distributors",
            localField: "distributor_id",
            foreignField: "_id",
            as: "distributors",
          },
        },
        {
          $unwind: "$distributors",
        },
        {
          $project: {
            _id: 0,
            "Distributor's Mobile Number/Email": "$mobile_no", // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Beneficiary Name": "$distributors.name",
            Comment: "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PAYTM DATA", paytm_data);
      const paytm_fields = [
        "Distributor's Mobile Number/Email",
        "Amount",
        "Beneficiary Name",
        "Comment",
      ];
      const paytmParser = new Parser({
        paytm_fields,
      });
      const csv_paytm =
        paytm_data.length > 0 ? paytmParser.parse(paytm_data) : "";
      let files = [];
      let d = new Date();
      d = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
      if (csv_paytm != "") {
        files.push({
          file_name: "Paytm_Requests_" + d + ".csv",
          data: csv_paytm,
          type: "LC_PTM_",
        });
      }
      if (csv_bank != "") {
        files.push({
          file_name: "Bank_Requests_" + d + ".csv",
          data: csv_bank,
          type: "LC_BNK_",
        });
      }
      return res.send({
        status: 1,
        files: files,
      });
    } catch (err) {
      logger.info("ERR", err);
      return res.send({
        status: 0,
        message: "Something is wrong, Please try again",
        error: err,
      });
    }
  },
  distExportCompleted: async (req, res, next) => {
    logger.info("export_dist_completed_request STARTED", req.body);
    try {
      let bank_match = {
        is_status: "A",
        payment_type: "bank",
      };
      let paytm_match = {
        is_status: "A",
        payment_type: "paytm",
      };
      if (req.body.data) {
        let _ids = _.isArray(req.body.data)
          ? req.body.data
          : JSON.parse(req.body.data);
        let final_ids = [];
        for (const id of _ids) {
          if (!Service.validateObjectId(id)) {
            return res.send({
              status: 0,
              Msg: localization.ServerError,
            });
          } else {
            final_ids.push(ObjectId(id));
          }
        }
        bank_match._id = {
          $in: final_ids,
        };
        paytm_match._id = {
          $in: final_ids,
        };
      }
      logger.info("DATA", bank_match, paytm_match); // phonepe_match, google_pay_match
      let bank_data = await DistributorWithdrawalRequest.aggregate([
        {
          $match: bank_match,
        },
        {
          $lookup: {
            from: "distributors",
            localField: "distributor_id",
            foreignField: "_id",
            as: "distributors",
          },
        },
        {
          $unwind: "$distributors",
        },
        {
          $project: {
            _id: 0,
            "A/C Holder Name": "$distributors.name",
            "A/C Number": "$account_no", // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
            IFSC: "$ifsc_code",
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Remarks (optional)": "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("BANK DATA", bank_data);
      const bank_fields = [
        "A/C Holder Name",
        "A/C Number",
        "IFSC",
        "Amount",
        "Remarks (optional)",
      ];
      const bankParser = new Parser({
        bank_fields,
      });
      const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : "";
      let paytm_data = await DistributorWithdrawalRequest.aggregate([
        {
          $match: paytm_match,
        },
        {
          $lookup: {
            from: "distributors",
            localField: "distributor_id",
            foreignField: "_id",
            as: "distributors",
          },
        },
        {
          $unwind: "$distributors",
        },
        {
          $project: {
            _id: 0,
            "Distributor's Mobile Number/Email": "$mobile_no", // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Beneficiary Name": "$distributors.name",
            Comment: "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PAYTM DATA", paytm_data);
      const paytm_fields = [
        "Agent's Mobile Number/Email",
        "Amount",
        "Beneficiary Name",
        "Comment",
      ];
      const paytmParser = new Parser({
        paytm_fields,
      });
      const csv_paytm =
        paytm_data.length > 0 ? paytmParser.parse(paytm_data) : "";
      let files = [];
      let d = new Date();
      d = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
      if (csv_paytm != "") {
        files.push({
          file_name: "Paytm_Requests_" + d + ".csv",
          data: csv_paytm,
          type: "LC_PTM_",
        });
      }
      if (csv_bank != "") {
        files.push({
          file_name: "Bank_Requests_" + d + ".csv",
          data: csv_bank,
          type: "LC_BNK_",
        });
      }
      return res.send({
        status: 1,
        files: files,
      });
    } catch (err) {
      logger.info("ERR", err);
      return res.send({
        status: 0,
        message: "Something is wrong, Please try again",
        error: err,
      });
    }
  },
  /* End Distributor Payout Export */
  /* Agent Payout Export */
  agentExportWithdrawal: async (req, res, next) => {
    logger.info("export_withdrawal_request STARTED", req.body);
    try {
      let bank_match = {
        is_status: "P",
        payment_type: "bank",
      };
      let paytm_match = {
        is_status: "P",
        payment_type: "paytm",
      };
      if (req.body.data) {
        let _ids = _.isArray(req.body.data)
          ? req.body.data
          : JSON.parse(req.body.data);
        let final_ids = [];
        for (const id of _ids) {
          if (!Service.validateObjectId(id)) {
            return res.send({
              status: 0,
              Msg: localization.ServerError,
            });
          } else {
            final_ids.push(ObjectId(id));
          }
        }
        bank_match._id = {
          $in: final_ids,
        };
        paytm_match._id = {
          $in: final_ids,
        };
      }
      logger.info("DATA", bank_match, paytm_match); // phonepe_match, google_pay_match
      let bank_data = await AgentWithdrawalRequest.aggregate([
        {
          $match: bank_match,
        },
        {
          $lookup: {
            from: "agents",
            localField: "agent_id",
            foreignField: "_id",
            as: "agents",
          },
        },
        {
          $unwind: "$agents",
        },
        {
          $project: {
            _id: 0,
            // "A/C Holder Name": "$user.username",
            "#A/C Number": {
              $concat: ["#", "$account_no"],
            }, // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
            IFSC: "$ifsc_code",
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Remarks (optional)": {
              $concat: [
                "$agents.username",
                "--",
                {
                  $toString: "$_id",
                },
              ],
            },
          },
        },
      ]).allowDiskUse(true);
      logger.info("BANK DATA", bank_data);
      const bank_fields = [
        "#A/C Number",
        "IFSC",
        "Amount",
        "Remarks (optional)",
      ];
      const bankParser = new Parser({
        bank_fields,
      });
      const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : "";
      let paytm_data = await AgentWithdrawalRequest.aggregate([
        {
          $match: paytm_match,
        },
        {
          $lookup: {
            from: "agents",
            localField: "agent_id",
            foreignField: "_id",
            as: "agents",
          },
        },
        {
          $unwind: "$agents",
        },
        {
          $project: {
            _id: 0,
            "Agent's Mobile Number/Email": "$mobile_no", // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Beneficiary Name": "$agents.username",
            Comment: "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PAYTM DATA", paytm_data);
      const paytm_fields = [
        "Agent's Mobile Number/Email",
        "Amount",
        "Beneficiary Name",
        "Comment",
      ];
      const paytmParser = new Parser({
        paytm_fields,
      });
      const csv_paytm =
        paytm_data.length > 0 ? paytmParser.parse(paytm_data) : "";
      let files = [];
      let d = new Date();
      d = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
      if (csv_paytm != "") {
        files.push({
          file_name: "Paytm_Requests_" + d + ".csv",
          data: csv_paytm,
          type: "LC_PTM_",
        });
      }
      if (csv_bank != "") {
        files.push({
          file_name: "Bank_Requests_" + d + ".csv",
          data: csv_bank,
          type: "LC_BNK_",
        });
      }
      return res.send({
        status: 1,
        files: files,
      });
    } catch (err) {
      logger.info("ERR", err);
      return res.send({
        status: 0,
        message: "Something is wrong, Please try again",
        error: err,
      });
    }
  },
  agentExportCompleted: async (req, res, next) => {
    logger.info("exportCompleted_request STARTED", req.body);
    try {
      let bank_match = {
        is_status: "A",
        payment_type: "bank",
      };
      let paytm_match = {
        is_status: "A",
        payment_type: "paytm",
      };
      if (req.body.data) {
        let _ids = _.isArray(req.body.data)
          ? req.body.data
          : JSON.parse(req.body.data);
        let final_ids = [];
        for (const id of _ids) {
          if (!Service.validateObjectId(id)) {
            return res.send({
              status: 0,
              Msg: localization.ServerError,
            });
          } else {
            final_ids.push(ObjectId(id));
          }
        }
        bank_match._id = {
          $in: final_ids,
        };
        paytm_match._id = {
          $in: final_ids,
        };
      }
      logger.info("DATA", bank_match, paytm_match); // phonepe_match, google_pay_match
      let bank_data = await AgentWithdrawalRequest.aggregate([
        {
          $match: bank_match,
        },
        {
          $lookup: {
            from: "agents",
            localField: "agent_id",
            foreignField: "_id",
            as: "agents",
          },
        },
        {
          $unwind: "$agents",
        },
        {
          $project: {
            _id: 0,
            "A/C Holder Name": "$agents.username",
            "A/C Number": "$account_no", // { $concat: ["#", "$account_no"] } , {$concat: ["=\"","$account_no","\""]}
            IFSC: "$ifsc_code",
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Remarks (optional)": "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("BANK DATA", bank_data);
      const bank_fields = [
        "A/C Holder Name",
        "A/C Number",
        "IFSC",
        "Amount",
        "Remarks (optional)",
      ];
      const bankParser = new Parser({
        bank_fields,
      });
      const csv_bank = bank_data.length > 0 ? bankParser.parse(bank_data) : "";
      let paytm_data = await AgentWithdrawalRequest.aggregate([
        {
          $match: paytm_match,
        },
        {
          $lookup: {
            from: "agents",
            localField: "agent_id",
            foreignField: "_id",
            as: "agents",
          },
        },
        {
          $unwind: "$agents",
        },
        {
          $project: {
            _id: 0,
            "Agent's Mobile Number/Email": "$mobile_no", // { $concat: ["#", { $substr: ["$mobile_no", 0, -1] }] }
            Amount: "$amount", // { $concat: ["#", { $substr: ["$amount", 0, -1] }] }
            "Beneficiary Name": "$agents.username",
            Comment: "$_id",
          },
        },
      ]).allowDiskUse(true);
      logger.info("PAYTM DATA", paytm_data);
      const paytm_fields = [
        "Agent's Mobile Number/Email",
        "Amount",
        "Beneficiary Name",
        "Comment",
      ];
      const paytmParser = new Parser({
        paytm_fields,
      });
      const csv_paytm =
        paytm_data.length > 0 ? paytmParser.parse(paytm_data) : "";
      let files = [];
      let d = new Date();
      d = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
      if (csv_paytm != "") {
        files.push({
          file_name: "Paytm_Requests_" + d + ".csv",
          data: csv_paytm,
          type: "LC_PTM_",
        });
      }
      if (csv_bank != "") {
        files.push({
          file_name: "Bank_Requests_" + d + ".csv",
          data: csv_bank,
          type: "LC_BNK_",
        });
      }
      return res.send({
        status: 1,
        files: files,
      });
    } catch (err) {
      logger.info("ERR", err);
      return res.send({
        status: 0,
        message: "Something is wrong, Please try again",
        error: err,
      });
    }
  },
  /* End Agent Payout Export */
  //All Game records for admin
  distributorData: async (limit) => {
const distributor=await Distributor.find({})
  .limit(limit)
  return distributor
  },


  playerManagementSystem: async (limit) => {
    const users = await User.find({
      is_deleted: false,
      role:"User"
    })
      .sort({
        created_at: -1
      })
      .limit(limit);
      console.log(users)
    const list = await Promise.all(
      users.map(async (u) => {
        let gamePlayedCount = await Table.countDocuments({
          "players.id": u._id,
        });
        // console.log(u);
        return {
          id: u._id,
          username: u.name,
          numeric_id: u.numeric_id,
          search_id: u.search_id,
          role: u.role,
          google_id:u.email,
          game_played: u.gamecount,
          wallet: u.balance,
          // win: u.win_wallet,
          is_active: u.is_active,
          // email_verified: u.email_verified,
          kyc_status: u.kyc_verified ? u.kyc_verified.status : "unverified",
          // otp_verified: u.otp_verified,
          created_at: await Service.formateDateandTime(u.created_at),
        };
      })
    );
    let count = await User.find({
      is_deleted: false,
    }).countDocuments();
    return {
      list,
      count,
    };
  },

  allGameRecords: async (limit) => {
    //var startTime = new Date();
    var allGameRecords = await Table.find({
      $expr: {
        $eq: [
          "$no_of_players",
          {
            $size: "$players",
          },
        ],
      },
    })
      .sort({
        created_at: -1,
      })
      .limit(limit);
      // console.log(allGameRecords);
    var gData = await Promise.all(
      allGameRecords.map(async (u) => {
        const players = [];
        for (const us of u.players) {
          // console.log(us);
          if (Service.validateObjectId(us.id)) {
            const user = await User.findById(us.id);
            console.log(user);
            players.push({
              id: user.id,
              username: user.username,
              numeric_id: user.numeric_id,
              rank: us.rank,
              pl: us.pl,
            });
          }
        }
        return {
          room: u.room,
          type: u.room_type,
          players: u.no_of_players,
          amount: u.room_fee,
          date: u.created_at,
          pdata: players,
        };
      })
    );
    var total = await Table.find({
      players: {
        $ne: [],
      },
    }).countDocuments();
    return {
      list: gData,
      total: total,
    };
  },
  updateGameMode: async (req, res) => {
    var params = _.pick(req.body, "status");
    //logger.info('ADMIN Game Mode Change REQUEST >> ', req.body);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    var status = await Default.findOneAndUpdate(
      {
        key: "app_version",
      },
      {
        $set: {
          undermaintenance: params.status,
        },
      }
    );
    if (status) {
      return res.send({
        status: 1,
        Msg: localization.success,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  updateBannerShow: async (req, res) => {
    var params = _.pick(req.body, "status");
    //logger.info('ADMIN Game Mode Change REQUEST >> ', req.body);
    if (!params) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    if (!params.status) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    var status = await Default.findOneAndUpdate(
      {
        key: "app_version",
      },
      {
        $set: {
          banner_status: params.status,
        },
      }
    );
    if (status) {
      return res.send({
        status: 1,
        Msg: localization.success,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  // updateEntryFees: async (req, res) => {
  //   var params = _.pick(req.body, "fees");
  //   // logger.info("ADMIN Entry Fees Change REQUEST >> ", req.body);
  //   // data = this.getAppVersion();
  //   if (!params) {
  //     return res.send({
  //       status: 0,
  //       Msg: localization.missingParamError,
  //     });
  //   }
  //   if (!params.fees) {
  //     return res.send({
  //       status: 0,
  //       Msg: localization.missingParamError,
  //     });
  //   }
  //   var fees = await Default.findOneAndUpdate(
  //     {
  //       key: "app_version",
  //     },
  //     {
  //       $set: {
  //         entryFees: JSON.parse(params.fees).toString(),
  //       },
  //     }
  //   );
  //   if (fees) {
  //     return res.send({
  //       status: 1,
  //       Msg: localization.success,
  //     });
  //   } else {
  //     return res.send({
  //       status: 0,
  //       Msg: localization.ServerError,
  //     });
  //   }
  // },
  updateEntryFees: async (req, res) => {
    var params = _.pick(req.body, "fees");
    var { type } = req.body;
    if (!params.fees) {
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }
    var updateQuery = {};
    updateQuery[`fees.${type}`] = JSON.parse(params.fees).toString();
    var fees = await Default.findOneAndUpdate(
      {
        key: "app_version",
      },
      {
        $set: updateQuery,
      }
    );
    if (fees) {
      return res.send({
        status: 1,
        Msg: localization.success,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  saveMaintenance: async (req, res) => {
    const {
      underMaintenance,
      bannerStatus,
      note,
      entryFees2,
      entryFees4,
      entryFeesPVT,
      banner,
    } = req.body;
    const updateObj = {
      undermaintenance: underMaintenance,
      note,
      fees: {
        2: entryFees2,
        4: entryFees4,
        PVT: entryFeesPVT,
      },
      banner_status: bannerStatus,
    };
    const data = await Default.findOne({ key: "app_version" });
    let currentBannerUrl = data.banner_url;
    if (req.files) {
      if (req.files.banner) {
        const bannerUrl = await Service.uploadFileLocal(req.files.banner, [
          "jpg",
          "png",
          "jpeg",
        ]);
        updateObj.banner_url = bannerUrl.replace("./public", "");
      } else {
        return res.send({
          status: 0,
          Msg: localization.bannnerImageValidationError,
        });
      }
    }
    const update = await Default.findOneAndUpdate(
      { key: "app_version" },
      { $set: updateObj }
    );
    if (update && updateObj.banner_url) {
      fs.unlink(path.resolve("./", "./public" + currentBannerUrl), (err) => {
        if (err) {
          throw err;
        }
        console.log(currentBannerUrl + " was deleted");
      });
    }
    if (update) {
      return res.send({
        status: 1,
        Msg: localization.success,
      });
    } else {
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  saveSettings: async (req, res) => {
    const form = req.body.form;
    let updateObj = {};
    if (form == 1) {
      const {
        contact_number,
        support_link,
        facebook_link,
        youtube_link,
        telegram_link,
        instragram_link,
        upiSetting,
      } = req.body;
      updateObj = {
        contact_number,
        support_link,
        facebook_link,
        youtube_link,
        telegram_link,
        instragram_link,
        upiSetting,
      };
    }
    if (form == 2) {
      const {
        minimum_deposite_balance,
        maximum_deposite_balance,
        minimum_withdraw_amount,
        maximum_withdraw_amount,
        withdrawCommission,
      } = req.body;
      updateObj = {
        minimum_deposite_balance,
        maximum_deposite_balance,
        minimum_withdraw_amount,
        maximum_withdraw_amount,
        withdrawCommission,
      };
    }
    if (form == 3) {
      const {
        first_level_refer_bonus,
        second_level_refer_bonus,
        refer_code_bonus,
        welcomeBonus,
        cardbonus,
        commission,
      } = req.body;
      updateObj = {
        first_level_refer_bonus,
        second_level_refer_bonus,
        refer_code_bonus,
        welcomeBonus,
        cardbonus,
        commission,
      };
    }
    if (form == 4) {
      const { fourPlayer, twoPlayer, showOnlinePlayer } = req.body;
      updateObj = {
        fourPlayer,
        twoPlayer,
        showOnlinePlayer,
      };
    }
    try {
      const update = await Default.findOneAndUpdate(
        { key: "app_version" },
        { $set: updateObj },
        { upsert: true, new: true }
      );
      if (update) {
        return res.json({ status: 1, Msg: "Settings saved successfully" });
      } else {
        return res.json({ status: 0, Msg: "Error saving settings" });
      }
    } catch (error) {
      console.error("Error saving settings", error);
      return res.status(500).json({ status: 0, Msg: "Error saving settings" });
    }
  },
  manuallyVerify: async function (req, res) {
    var params = _.pick(req.body, ["id"]);
    logger.info("PARAMS", params);
    if (!params)
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    if (!Service.validateObjectId(params.id)) {
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    }
    var rez = await User.findByIdAndUpdate(params.id, {
      $set: {
        email_verified: true,
      },
    });
    if (rez) return res.send(Service.response(1, localization.success, null));
    else return res.send(Service.response(0, localization.ServerError, null));
  },
  updateUserPassword: async (req, res) => {
    var params = _.pick(req.body, "user_id", "user_password");
    if (!params)
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    if (!Service.validateObjectId(params.user_id)) {
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    }
    if (!params.user_password) {
      return res
        .status(200)
        .json(Service.response(0, localization.missingParamError, null));
    }
    var hash = bcrypt.hashSync(params.user_password);
    var rez = await User.findByIdAndUpdate(params.user_id, {
      $set: {
        password: hash,
      },
    });
    if (rez) {
      var newLog = new AccessLog({
        admin: req.admin._id,
        action: `Changed user's account password`,
        user: params.user_id,
        created_at: new Date().getTime(),
      });
      await newLog.save();
      return res.send(Service.response(1, localization.success, null));
    } else return res.send(Service.response(0, localization.ServerError, null));
  },
  updateBanner: async (req, res) => {
    var startTime = new Date();
    var current_banner_url = "";
    try {
      var params = _.pick(req.body, "banner");
      if (!params) {
        return res.send({
          status: 0,
          Msg: localization.missingParamError,
        });
      }
      if (req.files) {
        if (req.files.banner) {
          var banner_url;
          banner_url = await Service.uploadFileLocal(req.files.banner, [
            "jpg",
            "png",
            "jpeg",
          ]);
          logger.info("S3 URL", banner_url);
        } else {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "uploadbanner");
          return res.send({
            status: 0,
            Msg: localization.bannnerImageValidationError,
          });
        }
      }
      if (banner_url && banner_url != "") {
        data = await Default.findOne({
          key: "app_version",
        });
        current_banner_url = data.banner_url;
        var update = await Default.findOneAndUpdate(
          {
            key: "app_version",
          },
          {
            $set: {
              banner_url: banner_url.replace("./public", ""),
            },
          }
        );
        if (update) {
          if (current_banner_url != "") {
            // let fullurl = req.protocol + '://' + req.headers.host+'/public'+current_banner_url;
            fs.unlink(
              path.resolve("./", "./public" + current_banner_url),
              (err) => {
                if (err) {
                  throw err;
                }
                console.log("test1.txt was deleted");
              }
            );
          }
          return res.send({
            status: 1,
            Msg: localization.success,
          });
        }
      } else {
        return res.send({
          status: 0,
          Msg: localization.bannnerImageValidationError,
        });
      }
    } catch (err) {
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "uploadbanner");
      res
        .status(200)
        .json(Service.response(0, localization.ServerError, err.message));
    }
  },
  uploadImages: async (req, res) => {
    var startTime = new Date();
    try {
      if (req.files) {
        if (req.files.banner) {
          var banner_url;
          banner_url = await Service.uploadFileLocal(req.files.banner, [
            "jpg",
            "png",
            "jpeg",
          ]);
          logger.info("S3 URL", banner_url);
          return res.send({
            status: 0,
            location: banner_url,
          });
        } else {
          var endTime = new Date();
          utility.logElapsedTime(req, startTime, endTime, "uploadbanner");
          return res.send({
            status: 0,
            location: localization.bannnerImageValidationError,
          });
        }
      }
    } catch (err) {
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "uploadbanner");
      res
        .status(200)
        .json(Service.response(0, localization.ServerError, err.message));
    }
  },
  editNoticeData: async (req, res) => {
    const { notice, noticeDate, noticeTitle,noticeId } = req.body;
console.log(notice, noticeDate, noticeTitle,noticeId)
    try {
    if(!notice || !noticeDate || !noticeTitle){
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }  
   let updateData=await noticeData.updateOne({noticeId:noticeId},{
    notice, noticeDate, noticeTitle
   })

    
    return res.send({
      status: 1,
      Msg: localization.success,
    });
    } catch (err) {
      console.error("Error saving notice:", err);
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  addnoticelist: async(req,res)=>{
    
    const {notice, userList, noticeTitle} = req.body
    console.log(notice)

    const noticelist = new noticeData(
     {
       notice,
       userList,
       noticeTitle
     }
    )
   const newNoticeList = await noticelist.save()
   res.status(200).send({"Data": newNoticeList})

 },
  saveNoticeData: async (req, res) => {
    const { notice, noticeDate, noticeTitle,noticeId } = req.body;

    try {
    if(!notice || !noticeDate || !noticeTitle){
      return res.send({
        status: 0,
        Msg: localization.missingParamError,
      });
    }  
    let noticeIdCheck=await noticeData.find().sort({created_at:-1}).limit(1)
    let noticeIds
    console.log(noticeIdCheck);
    if(noticeIdCheck.length>0){
      noticeIds=noticeIdCheck[0].noticeId+1
    }else{
      noticeIds=1
    }
    let saveData=new noticeData({
      notice, noticeDate, noticeTitle,noticeId:noticeIds
    })

    const saveNotice= await saveData.save()
    return res.send({
      status: 1,
      Msg: localization.success,
    });
    } catch (err) {
      console.error("Error saving notice:", err);
      return res.send({
        status: 0,
        Msg: localization.ServerError,
      });
    }
  },
  saveCreateAdminData: async (req, res) => {
  try {
    const { parentId,firstName,lastName,dob,email,phoneNo,address,state,district,block,postalCode,password,confirmPassword,securityPin } = req.body;
    console.log(parentId,firstName,lastName,dob,email,phoneNo,address,state,district,block,postalCode,password,confirmPassword,securityPin);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
    }
    // console.log(parentData);
    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
    if(confirmPassword !== password){
      return res.send({
        status: 0,
        Msg: "Confirm Password and Password is not match",
      });  
    }
   if (!firstName || !lastName || !email || !password ) {
    return res.send({
      status: 0,
      Msg: "Please provide all parameters",
    });
     }
 
    let emails = await User.findOne({ email });
    let distEmails = await Distributor.findOne({ email:email });
      if (emails || distEmails) {
        return res.send({
          status: 0,
          Msg: "Email already exists",
        });
      }
    // securityPin=1234
    const hashedSecurityPin = await bcrypt.hash("1234", 10);
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(urole,role)
  
    let twoSearchWord = "du"
   
    var search_id;
    
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    search_id = twoSearchWord + randomFiveDigits;
    
let parentDataExist = parentData!=null?new ObjectId(parentData._id):null
    let saveData = new Distributor({
      search_id,
      // numeric_id,
      firstName,
      lastName,
      dob,
      phoneNo,
      address,
      state,
      district,
      block,
      postalCode,
      email,
      password: hashedPassword,
      parent: parentDataExist,
      securityPin: hashedSecurityPin,
    });

    let saveUserData=await saveData.save();

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
saveEditAdminData: async (req, res) => {
  try {
    const {search_id, parentId,firstName,lastName,dob,email,phoneNo,address,state,district,block,postalCode,securityPin } = req.body;
    console.log(search_id,parentId,firstName,lastName,dob,email,phoneNo,address,state,district,block,postalCode,securityPin);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
    }
    // console.log(parentData);
    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
  
   if (!firstName || !lastName || !email  ) {
    return res.send({
      status: 0,
      Msg: "Please provide all parameters",
    });
     }
 
    let emails = await User.findOne({ email });
    let distEmails = await Distributor.findOne({ email:email });
      

    
let parentDataExist = parentData!=null?new ObjectId(parentData._id):null

const UpdatedData=await Distributor.updateOne({search_id},{$set:{firstName,lastName,dob,email,phoneNo,address,state,district,block,postalCode}})
    

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
saveCreateRankData: async (req, res) => {
  try {
    const { parentId,rankId,rankName,rankTargetWeek,rankTargetMonth,rankJoining,securityPin,updateData } = req.body;
    console.log(parentId,rankId,rankName,rankTargetWeek,rankTargetMonth,rankJoining,securityPin,updateData);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
    }
    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
   
    if (!rankId || !rankName || !rankTargetWeek || !rankTargetMonth || !rankJoining) {
      return res.send({
        status: 0,
        Msg: "Please Provide Full parameter",
      });
    }
    let dataPresent = await Rank_Data.findOne({ $or: [{ rankId: rankId }, { rankName: rankName }] });
    if(dataPresent){
      return res.send({
        status: 0,
        Msg: "Rank Id or Rank Name Already Exists",
      });
    }
   
    const RankDatas=new Rank_Data({
      parentId:new ObjectId(parentData._id),
      rankId,
      rankName,
      rankTargetWeek,
      rankTargetMonth,
      rankJoining
    })

    const saveData=await RankDatas.save()

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
getParentName:async(req,res)=>{
  let stateAllocated=null;
  let searchID =  req.query.search_id
  const parentName = await User.findOne({_id:searchID},{name:1, _id:0, role:1,stateAllocated:1,districtAllocated:1,areaAllocation:1,cash_balance:1,winning_balance:1})
  stateAllocated=parentName.stateAllocated
  console.log(parentName);

  const rolesData = await Rank_Data.find({}, { rankName: 1, rankId: 1, _id: 0 });
  const roles = {};

  rolesData.forEach(role => {
    roles[parseInt(role.rankId, 10)] = role.rankName;
  });

  const maxIndex = Math.max(...Object.keys(roles).map(Number));
  roles[1] = "Company";
  roles[maxIndex + 1] = "User";

  console.log(roles)
  const data = parentName.role;
  
  const currentRoleKey = Object.keys(roles).find((key) => roles[key] === data);

  const rolesBelow = Object.keys(roles).filter((key) => {
    return parseInt(key) > parseInt(currentRoleKey);
  }).map((key) => roles[key]);
  // rolesBelow.unshift("Company")

  return res.status(200).send({parentName:parentName,rolesBelow:rolesBelow,stateAllocated})
},

getIndianDistrict: async (req, res) => {
  try {
    const state=req.query.state
    console.log(state);
    let allState= IndiaState[state]
    console.log(allState);
    return res.status(200).send({district:allState})
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send({ error: 'Internal Server Error' });
  }
},
getIndianStates: async (req, res) => {
  try {

    let allState=Object.keys(IndiaState);

    return res.status(200).send({states:allState})
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send({ error: 'Internal Server Error' });
  }
},

 searchId: async (req, res) => {
    const roles = {
      1: "Company",
      2: "State",
      3: "District",
      4: "Zone",
      5: "Agent",
      6: "User",
    };

    let data=req.query.role
  
    const currentRoleKey = Object.keys(roles).find((key) => roles[key] === data);
    const rolesAbove = Object.keys(roles).filter((key) => {
      return parseInt(key) < parseInt(currentRoleKey);
    }).map((key) => roles[key]);
    const lastElement = rolesAbove[rolesAbove.length - 1];

    const rolesBelow = Object.keys(roles).filter((key) => {
      return parseInt(key) > parseInt(currentRoleKey);
    }).map((key) => roles[key]);

    console.log(roles[currentRoleKey]);
    let parentData= await User.find({role:roles[currentRoleKey]},{search_id:1,_id:0, role:1, name:1})
    // console.log(parentData);
      return res.status(200).send({parentIDs:parentData,rolesBelow})
  },
 selectedId: async (req, res) => {
    const roles = {
      1: "Company",
      2: "State",
      3: "District",
      4: "Zone",
      5: "Agent",
      6: "User",
    };

    
    let data=req.query.role
    let sentData= await User.find({role:data},{search_id:1,_id:0, role:1, name:1})
    console.log(sentData)
   return res.status(200).send({mydata:sentData})
  },
 childIds: async (req, res) => {
    const roles = {
      1: "Company",
      2: "State",
      3: "District",
      4: "Zone",
      5: "Agent",
      6: "User",
    };

    
    let data=req.query.role
  
    const currentRoleKey = Object.keys(roles).find((key) => roles[key] === data);

    const rolesAbove = Object.keys(roles).filter((key) => {
      return parseInt(key) < parseInt(currentRoleKey);
    }).map((key) => roles[key]);
    const lastElement = rolesAbove[rolesAbove.length - 1];
    
    // console.log(lastElement);
    let parentData= await User.find({role:data},{search_id:1,_id:0, role:1, name:1})
    // console.log(parentData);
      return res.status(200).send({parentIDs:parentData})
  },
updateRankData: async (req, res) => {
  try {
    const { parentId,rankId,rankName,rankTargetWeek,rankTargetMonth,rankJoining,securityPin,updateData } = req.body;
    console.log(parentId,rankId,rankName,rankTargetWeek,rankTargetMonth,rankJoining,securityPin,updateData);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
    }
    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
    if(updateData){
      let dataUpdate=await Rank_Data.updateOne({rankId:rankId},{
        $set:{rankName,rankTargetWeek,rankTargetMonth,rankJoining}
      })
      return res.send({
        status: 1,
        Msg: localization.success,
      });
    }
    if (!rankId || !rankName || !rankTargetWeek || !rankTargetMonth || !rankJoining) {
      return res.send({
        status: 0,
        Msg: "Please Provide Full parameter",
      });
    }
    let dataPresent = await Rank_Data.findOne({ $or: [{ rankId: rankId }, { rankName: rankName }] });
    if(dataPresent){
      return res.send({
        status: 0,
        Msg: "Rank Id or Rank Name Already Exists",
      });
    }
   
    const RankDatas=new Rank_Data({
      parentId:new ObjectId(parentData._id),
      rankId,
      rankName,
      rankTargetWeek,
      rankTargetMonth,
      rankJoining
    })

    const saveData=await RankDatas.save()

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
deleteRank: async (req, res) => {
  try {

    let rank_id=req.query.rank_id
  let deleteData=await Rank_Data.deleteOne({rankId:rank_id})

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
activeNotice: async (req, res) => {
  try {
console.log(req.query);
    let notice=req.query.notice
    let active_notice=req.query.active_notice
  
    let saveData=await noticeData.updateOne({noticeId:Number(notice)},{$set:({status:Number(active_notice)})})

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
acceptRequest: async (req, res) => {
  try {
console.log(req.query);
    let id=req.query.rank_id
    let type=req.query.type

    let findData=await DepositRequests.findOne({txn_id:id})
    if(type==1){

      console.log(findData);
      const saveData=await User.updateOne({_id:findData.user_id},{
        $inc:{cash_balance:findData.txn_amount}
      })
      const updateStatus=await DepositRequests.updateOne({txn_id:id},{is_status:"S"})
    }else{
      const saveData=await User.updateOne({_id:findData.child_id},{
        $inc:{cash_balance:findData.txn_amount}
      })
      const updateStatus=await DepositRequests.updateOne({txn_id:id},{is_status:"C"})
    }

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
deleteUser: async (req, res) => {
  try {

    let rank_id=req.query.rank_id
  let deleteData=await User.deleteOne({_id:rank_id})

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
deleteDistributor: async (req, res) => {
  try {

    let rank_id=req.query.rank_id
    console.log(rank_id);
  let deleteData=await Distributor.deleteOne({search_id:rank_id})

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
  modifyPlayerSave: async (req, res) => {
  try {
    const { name, email, password, role,balance,Roullete,Avaitor,CarRoullete,parentId,urole,securityPin } = req.body;
    console.log(name, email, password, role,balance,Roullete,Avaitor,CarRoullete,parentId,urole,securityPin);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
    }
    console.log(parentData);
    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
   if (!name || !email || !password || !role) {
    return res.send({
      status: 0,
      Msg: "Please provide all parameters",
    });
     }
 
    let emails = await User.findOne({ email });
      if (emails) {
        return res.send({
          status: 0,
          Msg: "Email already exists",
        });
      }
      if(role==="State"){
      const compareData=await Commission.findOne({type:"Company"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(role==="District"){
      const compareData=await Commission.findOne({type:"State"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(role==="Zone"){
      const compareData=await Commission.findOne({type:"District"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(role==="Agent"){
      const compareData=await Commission.findOne({type:"Zone"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(balance>parentId.balance){
        return res.send({
          status: 0,
          Msg: "Insufficient Balance",
        });
      }

    const hashedPassword = await bcrypt.hash(password, 10);
    var maxNumId = await User.find({}, ['numeric_id'])
    .sort({
        numeric_id: -1
    })
    .limit(1);
    var numeric_id;
    if (maxNumId.length == 0) numeric_id = 11111;
    else {
        if (maxNumId[0].numeric_id) numeric_id = maxNumId[0].numeric_id + 1;
        else numeric_id = 11111;
    }
    // console.log(urole,role)
    let searchRole = role.toLowerCase();
    let twoSearchWord = searchRole.slice(0, 2);
    
    var maxSearchId = await User.find({ role_prefix: twoSearchWord }, ['search_id'])
      .sort({
        search_id: -1
      })
      .limit(1);
    
    var search_id;
    
    if (maxSearchId.length === 0) {
      const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
      search_id = twoSearchWord + randomFiveDigits;
    } else {
      const lastNumber = parseInt(maxSearchId[0].search_id.slice(2)) + 1;
      search_id = twoSearchWord + lastNumber.toString().padStart(5, '0');
    }
    
    // console.log(search_id);
    
let parentDataExist = parentData!=null?new ObjectId(parentData._id):null
    let saveData = new User({
      search_id,
      numeric_id,
      name,
      email,
      password: hashedPassword,
      role,
      balance,
      parent: parentDataExist,
    });

    let saveUserData=await saveData.save();
    let adminBalace=0
if(parentData){
   adminBalace=parentData.balance-balance
   let balanceUpdate = await User.findByIdAndUpdate({_id:parentData._id}, {balance:adminBalace})
}

// console.log(parentDataExist);
    let newTxnAdmin = new Transaction({
      user_id: saveUserData._id,
      txn_amount: Number(balance),
      created_at: new Date().getTime(),
      transaction_type: "D",
      resp_msg:  `Deposit to ${name}` ,
      current_balance: adminBalace,
      is_status: "S",
      txn_mode: "A",
    })
    let txnAdmin = await newTxnAdmin.save();

    var newTxn = new Transaction({
      user_id: parentDataExist,
      txn_amount: Number(balance),
      created_at: new Date().getTime(),
      transaction_type: "C",
      resp_msg:  "Deposit by Admin",
      is_status: "S",
      txn_mode: "A",
    });
    let txnres = await newTxn.save();

    let userCommission=new  UserCommission({
      type:role,
      parent:parentDataExist,
      user:saveUserData._id,
      Roullete,
      Avaitor,
      CarRoullete
    })
    await userCommission.save();
    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
saveModifyPlayerData: async (req, res) => {
  try {
    const { name, email,role,parentName,parentId,securityPin } = req.body;
    console.log(name, email,role,parentName,parentId,securityPin);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
    }
    console.log(parentData);
    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
   if (!name || !email || !password || !role) {
    return res.send({
      status: 0,
      Msg: "Please provide all parameters",
    });
     }
 
    let emails = await User.findOne({ email });
      if (emails) {
        return res.send({
          status: 0,
          Msg: "Email already exists",
        });
      }
      if(role==="State"){
      const compareData=await Commission.findOne({type:"Company"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(role==="District"){
      const compareData=await Commission.findOne({type:"State"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(role==="Zone"){
      const compareData=await Commission.findOne({type:"District"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(role==="Agent"){
      const compareData=await Commission.findOne({type:"Zone"})
      if(compareData.CarRoullete<CarRoullete || compareData.Avaitor<Avaitor || compareData.Roullete<Roullete){
        return res.send({
          status: 0,
          Msg: "Commission is Higher than above level",
        });
      }}
      if(balance>parentId.balance){
        return res.send({
          status: 0,
          Msg: "Insufficient Balance",
        });
      }

    const hashedPassword = await bcrypt.hash(password, 10);
    var maxNumId = await User.find({}, ['numeric_id'])
    .sort({
        numeric_id: -1
    })
    .limit(1);
    var numeric_id;
    if (maxNumId.length == 0) numeric_id = 11111;
    else {
        if (maxNumId[0].numeric_id) numeric_id = maxNumId[0].numeric_id + 1;
        else numeric_id = 11111;
    }
    // console.log(urole,role)
    let searchRole = role.toLowerCase();
    let twoSearchWord = searchRole.slice(0, 2);
    
    var maxSearchId = await User.find({ role_prefix: twoSearchWord }, ['search_id'])
      .sort({
        search_id: -1
      })
      .limit(1);
    
    var search_id;
    
    if (maxSearchId.length === 0) {
      const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
      search_id = twoSearchWord + randomFiveDigits;
    } else {
      const lastNumber = parseInt(maxSearchId[0].search_id.slice(2)) + 1;
      search_id = twoSearchWord + lastNumber.toString().padStart(5, '0');
    }
    
    // console.log(search_id);
    
let parentDataExist = parentData!=null?new ObjectId(parentData._id):null
    let saveData = new User({
      search_id,
      numeric_id,
      name,
      email,
      password: hashedPassword,
      role,
      balance,
      parent: parentDataExist,
    });

    let saveUserData=await saveData.save();
    let adminBalace=0
if(parentData){
   adminBalace=parentData.balance-balance
   let balanceUpdate = await User.findByIdAndUpdate({_id:parentData._id}, {balance:adminBalace})
}

// console.log(parentDataExist);
    let newTxnAdmin = new Transaction({
      user_id: saveUserData._id,
      txn_amount: Number(balance),
      created_at: new Date().getTime(),
      transaction_type: "D",
      resp_msg:  `Deposit to ${name}` ,
      current_balance: adminBalace,
      is_status: "S",
      txn_mode: "A",
    })
    let txnAdmin = await newTxnAdmin.save();

    var newTxn = new Transaction({
      user_id: parentDataExist,
      txn_amount: Number(balance),
      created_at: new Date().getTime(),
      transaction_type: "C",
      resp_msg:  "Deposit by Admin",
      is_status: "S",
      txn_mode: "A",
    });
    let txnres = await newTxn.save();

    let userCommission=new  UserCommission({
      type:role,
      parent:parentDataExist,
      user:saveUserData._id,
      Roullete,
      Avaitor,
      CarRoullete
    })
    await userCommission.save();
    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
  saveAddRankDataByParent: async (req, res) => {
  try {
    const { firstName,lastName, email, address,postalCode,phone,state, district,password,role,balance,parentName,parentId,securityPin } = req.body;
    console.log(firstName,lastName, email, address,postalCode,phone,state, district,password,role,balance,parentName,parentId,securityPin);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
    }
    console.log(parentData);
    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
   if ( !email || !password || !role) {
    return res.send({
      status: 0,
      Msg: "Please provide all parameters",
    });
     }
 
    let emails = await User.findOne({ email });
      if (emails) {
        return res.send({
          status: 0,
          Msg: "Email already exists",
        });
      }

      if(balance>parentId.balance){
        return res.send({
          status: 0,
          Msg: "Insufficient Balance",
        });
      }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash("1234", 10);
    var maxNumId = await User.find({}, ['numeric_id'])
    .sort({
        numeric_id: -1
    })
    .limit(1);
    var numeric_id;
    if (maxNumId.length == 0) numeric_id = 11111;
    else {
        if (maxNumId[0].numeric_id) numeric_id = maxNumId[0].numeric_id + 1;
        else numeric_id = 11111;
    }
    // console.log(urole,role)
    let searchRole = role.toLowerCase();
    let twoSearchWord = searchRole.slice(0, 2);
    
    var maxSearchId = await User.find({ role_prefix: twoSearchWord }, ['search_id'])
      .sort({
        search_id: -1
      })
      .limit(1);
    
    var search_id;
    
    if (maxSearchId.length === 0) {
      const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
      search_id = twoSearchWord + randomFiveDigits;
    } else {
      const lastNumber = parseInt(maxSearchId[0].search_id.slice(2)) + 1;
      search_id = twoSearchWord + lastNumber.toString().padStart(5, '0');
    }
    
    // console.log(search_id);
    
let parentDataExist = parentData!=null?new ObjectId(parentData._id):null
    let saveData = new User({
      search_id,
      numeric_id,
      name:firstName,
      first_name:firstName,
      last_name:lastName,
      email,
      password: hashedPassword,
      role,
      cash_balance:balance,
      parent: parentDataExist,
      phone,
      state, district,postalCode,address,
      security_pin:hashedPin
      // device_id:generateRandomString(10)
    });

    let saveUserData=await saveData.save();
    let adminBalace=0
if(parentData){
   adminBalace=parentData.balance-balance
   let balanceUpdate = await User.findByIdAndUpdate({_id:parentData._id}, {balance:adminBalace})
}

// console.log(parentDataExist);
    let newTxnAdmin = new Transaction({
      user_id: saveUserData._id,
      txn_amount: Number(balance),
      created_at: new Date().getTime(),
      transaction_type: "D",
      resp_msg:  `Deposit by Admin` ,
      current_balance: adminBalace,
      is_status: "S",
      txn_mode: "A",
    })
    let txnAdmin = await newTxnAdmin.save();

    var newTxn = new Transaction({
      user_id: parentDataExist,
      txn_amount: Number(balance),
      created_at: new Date().getTime(),
      transaction_type: "C",
      resp_msg:  "Deposit to ${firstName}",
      is_status: "S",
      txn_mode: "A",
    });
    let txnres = await newTxn.save();


    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
saveTransferPoint: async (req, res) => {
  try {
    const { role , userSearchId, securityPin, balance, debitCredit } = req.body;
    console.log(role , userSearchId, securityPin, balance, debitCredit);
    if(!role || !userSearchId || !securityPin || !balance  || !debitCredit){
      return res.send({
        status: 0,
        Msg: "Please provide all parameters",
      });
    }
    var rez1 = await bcrypt.compare(securityPin, req.admin.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
    const user = await User.findOne({ _id: userSearchId })
    // console.log(user)
    if (!user) {
        return res.json({ response: { status: false, message: 'Invalid User' } });
    }

    if(debitCredit==="Debit"){

        let point = Number(balance)
        if(user.cash_balance > point){
          return res.send({
            status: 0,
            Msg: "Insuffiecent Amount",
          });
        }
        let transcId=await DepositRequests.find({}).sort({created_at:-1}).limit(1)
  
        if(transcId.length==0){
            transcId=0
        }
        else{
            transcId=transcId[0].txn_id
        }
        transcId=transcId+1
  // console.log(req.admin._id,user._id)
        const updateAdmin=await User.updateOne({_id:req.admin._id},{$inc:{cash_balance:point}})
        const updateUser=await User.updateOne({_id:user._id},{$inc:{cash_balance:-point}})

        var userTxnHistry = new Transaction({
          user_id: user._id,
          txn_amount: point,
          current_balance:user.cash_balance- point,
          created_at: new Date().getTime(),
          transaction_type: "D",
          resp_msg:  "Debited by Company",
          is_status: "S",
          txn_mode: "A",
          txn_id:transcId
        });
            let txnres = await userTxnHistry.save();

        var adminTxnHistory = new Transaction({
          user_id: req.admin._id,
          txn_amount: point,
          current_balance:req.admin.cash_balance+ point,
          created_at: new Date().getTime(),
          transaction_type: "C",
          resp_msg: `Credit To ${user.first_name} ${user.last_name}`,
          is_status: "S",
          txn_mode: "A",
          txn_id:transcId+1
        });
            let txnresadmin = await adminTxnHistory.save();
    }else{
        let point = Number(balance)
        let transcId=await DepositRequests.find({}).sort({created_at:-1}).limit(1)
  
        if(transcId.length==0){
            transcId=0
        }
        else{
            transcId=transcId[0].txn_id
        }
        transcId=transcId+1
        const updateAdmin=await User.updateOne({_id:req.admin._id},{$inc:{cash_balance:-point}})
        const updateUser=await User.updateOne({_id:user._id},{$inc:{cash_balance:point}})

        var userTxnHistry = new Transaction({
          user_id: user._id,
          txn_amount: point,
          current_balance:user.cash_balance- point,
          created_at: new Date().getTime(),
          transaction_type: "C",
          resp_msg:  "Deposit by Company",
          is_status: "S",
          txn_mode: "A",
          txn_id:transcId
        });
            let txnres = await userTxnHistry.save();

        var adminTxnHistory = new Transaction({
          user_id: req.admin._id,
          txn_amount: point,
          current_balance:req.admin.cash_balance+ point,
          created_at: new Date().getTime(),
          transaction_type: "D",
          resp_msg: `Deposit To ${user.first_name} ${user.last_name}`,
          is_status: "S",
          txn_mode: "A",
          txn_id:transcId+1
        });
            let txnresadmin = await adminTxnHistory.save();
    
    }
    
    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
editUserSave: async (req, res) => {
  try {
    const { role , lastName, firstName, email,state, district,postalCode,address,phone,parentName,parentId,securityPin } = req.body;
    console.log(role , lastName, firstName, email,state, district,postalCode,address,phone,parentName,parentId,securityPin);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({search_id:parentId})
      
    }
    if(parentData !== null ){
      const rankLimit=await Rank_Data.findOne({rankName:parentData.role})
      const parentChildLength=await User.find({parent:parentData._id})
      console.log(parentChildLength.length,rankLimit.rankJoining);
      if(parentChildLength.length>=rankLimit.rankJoining){
        return res.send({
          status: 0,
          Msg: "Limit Reached of Creating User",
        });
      }
      
    }
    if(!securityPin){
      return res.send({
        status: 0,
        Msg: "Please Enter Security Pin",
      });
    }

    var rez1 = await bcrypt.compare(securityPin, parentData.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
 
    let user = await User.findOne({ email });

    const saveData=await User.updateOne({_id:user._id},{$set:{name:firstName,first_name:firstName,last_name:lastName,phone:phone,state:state,district:district,postalCode:postalCode,address:address}})

    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
  saveAddRankData: async (req, res) => {
  try {
    const { parentId,userSecurityPin, stateAllocation, districtAllocation,areaAllocation,firstName, lastName, phone, email, userState, userDistrict, address, pinCode, aadharNumber, password, cPassword, securityPin, userRole } = req.body;
    console.log(parentId, userSecurityPin,stateAllocation, districtAllocation,areaAllocation,firstName, lastName, phone, email, userState, userDistrict, address, pinCode, aadharNumber, password, cPassword, securityPin, userRole);
    let parentData= null
    if(parentId){
      parentData=await User.findOne({_id:parentId})
      
    }
    // if(parentData !== null ){
    //   const rankLimit=await Rank_Data.findOne({rankName:parentData.role})
    //   const parentChildLength=await User.find({parent:parentData._id})
    //   console.log(parentChildLength.length,rankLimit.rankJoining);
    //   if(parentChildLength.length>=rankLimit.rankJoining){
    //     return res.send({
    //       status: 0,
    //       Msg: "Limit Reached of Creating User",
    //     });
    //   }
      
    // }
    if(!securityPin){
      return res.send({
        status: 0,
        Msg: "Please Enter Security Pin",
      });
    }

    var rez1 = await bcrypt.compare(securityPin, req.admin.security_pin);
    if(!rez1){
      return res.send({
        status: 0,
        Msg: "Please Enter Correct Security Pin",
      });
    }
   if (password !== cPassword) {
    return res.send({
      status: 0,
      Msg: "Password is not match",
    });
     }
   if (!email || !password || !userRole) {
    return res.send({
      status: 0,
      Msg: "Please provide all parameters",
    });
     }
 
    let emails = await User.findOne({ phone });
      if (emails) {
        return res.send({
          status: 0,
          Msg: "Phone No. already exists",
        });
      }
   
  

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(userSecurityPin, 10);
    var maxNumId = await User.find({}, ['numeric_id'])
    .sort({
        numeric_id: -1
    })
    .limit(1);
    var numeric_id;
    if (maxNumId.length == 0) numeric_id = 11111;
    else {
        if (maxNumId[0].numeric_id) numeric_id = maxNumId[0].numeric_id + 1;
        else numeric_id = 11111;
    }
    let searchRole = userRole.toLowerCase();
    let twoSearchWord = searchRole.slice(0, 2);
    
    var maxSearchId = await User.find({ role_prefix: twoSearchWord }, ['search_id'])
      .sort({
        search_id: -1
      })
      .limit(1);
    
    var search_id;
    
    if (maxSearchId.length === 0) {
      const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
      search_id = twoSearchWord + randomFiveDigits;
    } else {
      const lastNumber = parseInt(maxSearchId[0].search_id.slice(2)) + 1;
      search_id = twoSearchWord + lastNumber.toString().padStart(5, '0');
    }
    

let parentDataExist = parentData!=null?new ObjectId(parentData._id):null
    let saveData = new User({
      search_id,
      numeric_id,
      name:firstName,
      first_name:firstName,
      last_name:lastName,
      email,
      password: hashedPassword,
      role:userRole,
      aadharNumber:aadharNumber,
      stateAllocated:stateAllocation,
      districtAllocated:districtAllocation,
      areaAllocation:areaAllocation,
      parent: parentDataExist,
      phone,
      state:userState, 
      district:userDistrict,
      address,
      pinCode,
      security_pin:hashedPin

    });

    let saveUserData=await saveData.save();


    return res.send({
      status: 1,
      Msg: localization.success,
    });
  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},
saveCommissionMgt: async (req, res) => {
  try {
    const { gameType, rowData } = req.body;
    const user = req.admin;

    // console.log(rowData.length);

    const sortedData = rowData.sort((a, b) => parseInt(a.rankId) - parseInt(b.rankId));

    for (let i = 1; i < sortedData.length; i++) {
      const currentRank = sortedData[i];
      const previousRank = sortedData[i - 1];

      const currentAvailableCommission = parseInt(currentRank.availableCommission);
      const previousDownline = parseInt(previousRank.downline);
      const currentOwnCommission = parseInt(currentRank.ownCommission);
      const currentMinCommission = parseInt(currentRank.minCommission);

      if (currentAvailableCommission > previousDownline) {
        return res.status(400).json({
          status: 0,
          Msg: `Available Commission for Rank ${currentRank.rankName} cannot be higher than Downline of Rank ${previousRank.rankName}.`
        });
      }

      if (currentOwnCommission < currentMinCommission) {
        return res.status(400).json({
          status: 0,
          Msg: `Own Commission for Rank ${currentRank.rankName} cannot be less than Minimum Commission.`
        });
      }
    }

    // All checks passed, update the database
    const commissionUpdates = sortedData.map(async (com) => {
      await Commission.updateOne(
        { gameType: gameType, rankId: com.rankId },
        { $set: com },
        { upsert: true }
      );
    });

    // Wait for all updates to complete
    await Promise.all(commissionUpdates);

    res.status(200).json({
      status: 1,
      Msg: "Commission data saved successfully."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      Msg: "Internal server error."
    });
  }
}

,
saveCommissionLimit: async (req, res) => {
// const saveAddRankData = async (req, res) => {
  try {
    const { atype,ctype, cardRoullete, avaitor } = req.body;
    const user=req.admin
if(!atype || !ctype || !cardRoullete || !avaitor){
  return res.send({
    status: 0,
    Msg: "Please Provide full parameter",
  });
}
    const updateDataAvaitor=await ProfitPercent.updateOne({gameType:atype},{$set:{gamePercent:avaitor}},{upsert:true})
    const updateDataRoullete=await ProfitPercent.updateOne({gameType:ctype},{$set:{gamePercent:cardRoullete}},{upsert:true})
    return res.send({
      status: 1,
      Msg: localization.success,
    });

  } catch (err) {
    console.error("Error saving data:", err);
    return res.send({
      status: 0,
      Msg: localization.ServerError,
    });
  }
},

  bannerList: async (req, limit) => {
    const banners = await Banners.find({})
      .sort({
        created_at: -1,
      })
      .limit(limit);
    let count = await Banners.find({}).countDocuments();
    return {
      list: banners,
      count,
    };
  },
  addBanner: async (req, res, next) => {
    let params = _.pick(req.body, "url", "isActive");
    if (_.isEmpty(params)) {
      return res
        .status(200)
        .json(Service.response(0, localization.missingParamError, null));
    }
    if (_.isEmpty(params.url) || _.isEmpty(params.isActive)) {
      return res.send({
        status: 0,
        message: localization.missingParamError,
      });
    }
    if (req.files) {
      if (req.files.profilePicture) {
        params.profilePicture = await Service.uploadFileLocal(
          req.files.profilePicture,
          ["jpeg", "jpg", "png"]
        );
        if (!params.profilePicture) {
          return res.send({
            status: 0,
            Msg: localization.bannnerImageValidationError,
          });
        }
        params.profilePicture = params.profilePicture.replace("./public", "");
      } else {
        return res.send({
          status: 0,
          Msg: localization.bannnerImageValidationError,
        });
      }
    } else {
      return res
        .status(200)
        .json(Service.response(0, localization.missingParamError, null));
    }
    let obj = {
      url: params.url,
      image: params.profilePicture ?? "",
      is_active: params.isActive,
      created_at: new Date().getTime(),
    };
    let resp = new Banners(obj);
    await resp.save();
    if (!resp)
      return res
        .status(200)
        .json(Service.response(0, localization.ServerError, null));
    return res
      .status(200)
      .json(Service.response(1, localization.success, resp));
  },
  getBannerListAjax: async (req, res, next) => {
    let startTime = new Date();
    try {
      const params = req.query;
      let obj = {};
      if (params.search) {
        if (params.search.value.trim() != "") {
          obj["$or"] = [
            {
              url: {
                $regex: params.search.value,
                $options: "i",
              },
            },
          ];
        }
      }
      let sortObj = {};
      if (params.order) {
        if (params.order[0]) {
          if (params.order[0].column == "2") {
            // SORT BY EMAIL
            sortObj.url = params.order[0].dir == "asc" ? 1 : -1;
          } else if (params.order[0].column == "3") {
            // SORT BY WALLET
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
      let list = await Banners.aggregate([
        {
          $match: obj,
        },
        {
          $sort: sortObj,
        },
        {
          $skip: parseInt(params.start),
        },
        {
          $limit: params.length == -1 ? "" : parseInt(params.length),
        },
      ]).allowDiskUse(true);
      let i = 1;
      list = await Promise.all(
        list.map(async (u) => {
          return [
            i++,
            `<img src="${u.image}" style="width: 200px;height: 100px;">`,
            `<a href="${u.url}" target="_blank">${u.url}</a>`,
            u.created_at,
            `<small class="label bg-${u.is_active ? "green" : "red"}">${u.is_active ? "Active" : "Inactive"
            }</small>`,
            // `<a target="_blank" href="${config.pre + req.headers.host}/banners/view/${
            //     u._id
            // }" class="on-editing save-row"><i class="fa fa-eye"></i></a>`
            `<button type="button" class="btn ${u.is_active ? "btn-danger deactivateBanner" : "btn-success activateBanner"} btn-block" data-id="${u._id}">${u.is_active ? "Deactivate" : "Activate"}</button> <button class="btn btn-warning btn-block deleteBanner" data-id='${u._id}'>Delete</button>`,
          ];
        })
      );
      let total = await Banners.find().countDocuments();
      let total_f = await Banners.find(obj).countDocuments();
      let endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "getDistributorListAjax");
      return res.status(200).send({
        data: list,
        draw: new Date().getTime(),
        recordsTotal: total,
        recordsFiltered: total_f,
      });
    } catch (err) {
      let endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, "getBannerListAjax");
      return res.send(
        Service.response(0, localization.ServerError, err.message)
      );
    }
  },
  bannerUpdateStatus: async function (req, res) {
    var startTime = new Date();
    var params = _.pick(req.body, ["id", "status"]);
    //logger.info("PARAMS", params);
    if (!params)
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    if (!Service.validateObjectId(params.id)) {
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    }
    var rez = await Banners.findByIdAndUpdate(params.id, {
      $set: {
        is_active: params.status == "true",
      },
    });
    var endTime = new Date();
    utility.logElapsedTime(req, startTime, endTime, "updateStatus");
    if (rez) {
      return res.send(Service.response(1, localization.success, null));
    } else return res.send(Service.response(0, localization.ServerError, null));
  },
  bannerDelete: async function (req, res) {
    var startTime = new Date();
    var params = _.pick(req.body, ["id"]);
    //logger.info("PARAMS", params);
    if (!params)
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    if (!Service.validateObjectId(params.id)) {
      return res.send(
        Service.response(0, localization.missingParamError, null)
      );
    }
    let banner = await Banners.findById(params.id);
    if (banner.image != "") {
      fs.unlink(
        path.resolve("./", "./public" + banner.image),
        (err) => {
          if (err) {
            // throw err;
          }
          console.log("test1.txt was deleted");
        }
      );
    }
    var rez = await Banners.findByIdAndDelete(params.id);
    var endTime = new Date();
    utility.logElapsedTime(req, startTime, endTime, "bannerDelete");
    if (rez) {
      return res.send(Service.response(1, localization.success, null));
    } else return res.send(Service.response(0, localization.ServerError, null));
  },
};
