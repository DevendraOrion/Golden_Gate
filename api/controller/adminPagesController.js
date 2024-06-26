const AdminController = require("./adminController");
const paymentController = require("./paymentController");
const distributorController = require("./distributorController");
const AgentController = require("./agentController");
const noticeData = require("./../models/notice-data");
(config = require("./../../config")),
  ({ User } = require("./../models/user")),
  ({ AccessLog } = require("./../models/accessLog")),
  (Table = require("./../models/table")),
  (Admin = require("./../models/superAdmin")),
  (_ = require("lodash")),
  (localization = require("./../service/localization"));

const Service = require("./../service");
const kycController = require("./kycController");
const blogController = require("./blogController");
var { User } = require("../models/user")
var { Updated_stats } = require('../models/updatedStats')

Table = require("../models/table"),
  { Blogs } = require("../models/blogs");
const adminController = require("./adminController");

module.exports = {
  dashboard: async (req, res) => {
    var data = {};
    data.distributor_count = await distributorController.getAllDistributorCount(
      req
    );

    data.chipCount = await AdminController.getAllChip(req.admin);
    data.user_count = await AdminController.getAllUserCount(req.admin);
    data.totalWithRequest = await AdminController.totalWithRequest(req.admin);
    data.guest_count = await AdminController.getAllGuestUserCount(req.admin);
    data.game_count = await AdminController.getAllGameCount(req.admin);
    data.most_preferred = await AdminController.mostPreferredAmount(req.admin);
    data.latest_user = await AdminController.latestUser(req.admin);
    data.graph_data = await AdminController.chartData(req.admin);
    data.deposit = await AdminController.getDepositCount(req.admin);
    data.withdrawl = await AdminController.getWithdrawlCount(req.admin);
    data.chipCirculated = await AdminController.getReferralCount(req.admin);
    data.total_state = await AdminController.getTotal_state(req.admin);
    data.total_district = await AdminController.getTotal_district(req.admin);
    data.total_agent = await AdminController.getTotal_agent(req.admin);
    data.total_user = await AdminController.getTotal_user(req.admin);

    res.render("admin/index", {
      title: "Dashboard",
      type: "dashboard",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },

  noticeManagement: async (req, res) => {
    const users = await AdminController.getNoticeData();
    res.render("admin/noticeManagement", {
      title: "Rule Management",
      type: "notice",
      sub: "notice",
      sub2: "noticeManagement",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
    });

  },
  generateChip: async (req, res) => {
    let data = await noticeData.findOne({});
    res.render("admin/generateChip", {
      title: "Generate Chip",
      type: "generate",
      sub: "chip",
      sub2: "chip",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  notice: async (req, res) => {
    let data = await noticeData.findOne({});
    res.render("admin/notice", {
      title: "Rule Management",
      type: "notice",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  getnoticelist: async (req, res) => {
    let data = await User.find({ role: "User" }, { search_id: 1, _id: 0 });

    res.render("admin/sendNotification", {
      title: "Send Notification ",
      type: "notice",
      sub: "dashboard",
      sub2: "sendNotification",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });

  },
  changePass: async (req, res) => {
    const data = await distributorController.addRankssData(req)
    res.render("admin/SepratePinPass", {
      title: "Change Password",
      type: "passPin",
      sub: "pass",
      sub2: "pass",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
      pass: true
    });
  },
  changePin: async (req, res) => {
    const data = await distributorController.addRankssData(req)
    res.render("admin/SepratePinPass", {
      title: "Change Security Pin",
      type: "passPin",
      sub: "pin",
      sub2: "pin",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
      pass: false
    });
  },
  transferPoint: async (req, res) => {
    const data = await distributorController.addRankssData(req)
    res.render("admin/transferPoint", {
      title: "Chip Transfer",
      type: "transfer",
      sub: "transferPoint",
      sub2: "transferPoint",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  transferPointToUpper: async (req, res) => {
    const data = await distributorController.addRankssData(req)
    res.render("admin/transferPointToUpper", {
      title: "Chip Transfer To Upper Level",
      type: "transfer",
      sub: "transferPointToUpper",
      sub2: "transferPointToUpper",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  depositRequest: async (req, res) => {
    let admin = req.admin
    const users = await AdminController.getDepositRequest(admin);
    // console.log(users.list);
    res.render("admin/depostRequest", {
      title: "Accept Chip Request",
      type: "pointTransfer",
      sub: "depositRequest",
      sub2: "depositRequest",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
    });
  },
  transferReport: async (req, res) => {
    let TxnMode = "T"
    let admin = req.admin
    const transactions = await paymentController.transferPoint(admin, TxnMode);
    // console.log(transactions.list.length);
    res.render("admin/transferReport", {
      title: "Chip Transfer History",
      type: "pointTransfer",
      sub: "transferReport",
      sub2: "transferReport",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      chip: "report"
    });

  },

  chipcurlation: async (req, res) => {
    console.log("-=--=-=");
    let admin = req.admin
    const data = await paymentController.chipcalclution(admin);
    // console.log(transactions.list.length);
    res.render("admin/chipcurlation", {
      title: "Chip curlation",
      type: "pointTransfer",
      sub: "transferReport",
      sub2: "transferReport",
      total: data.length,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
      chip: "report"
    });

  },

  generateHistory: async (req, res) => {
    let TxnMode = "U"
    let admin = req.admin
    const transactions = await paymentController.transferPoint(admin, TxnMode);
    console.log(transactions.list.length);
    res.render("admin/transferReport", {
      title: "Generate Chip History",
      type: "generateChip",
      sub: "generateChipHistory",
      sub2: "generateChipHistory",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      chip: "generate"
    });

  },
  commRoullete: async (req, res) => {
    // let data = await noticeData.findOne({});
    let comm = "Roullete"
    // const data = await distributorController.addRankssData(req,role)
    let data = []
    res.render("admin/carRoullatCommissionreport", {
      title: "Rolllatt Report",
      type: "comission",
      sub: "commMaster",
      sub2: "roullete",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  commAvatior: async (req, res) => {
    // let data = await noticeData.findOne({});
    let comm = "Avatior";
    // const data = await distributorController.addRankssData(req,role)
    let data = []
    res.render("admin/carRoullatCommissionreport", {
      title: "Avatior",
      type: "comission",
      sub: "commMaster",
      sub2: "avatior",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  changePinPass: async (req, res) => {
    // let data = await noticeData.findOne({});
    const user = await AdminController.getUserDetails(
      req.params.id,
      req.admin._id
    );
    const data = await distributorController.addRankData(user)
    res.render("admin/changePinPass", {
      title: "Change Security Pin or Password",
      type: "pinPass",
      sub: "pinPass",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  addRank: async (req, res) => {
    // let data = await noticeData.findOne({});
    const user = await AdminController.getUserDetails(
      req.params.id,
      req.admin._id
    );
    const data = await distributorController.addRankData(user)
    res.render("admin/addRank", {
      title: "Add Rank",
      type: "addRank",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  Commission: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/Commission", {
      title: "Commission",
      type: "Commission",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  revenueReport: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  BusinessReport: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  Setting: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  DistributerSecurityPinMgt: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  RevenueMaster: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  ProfitPercentMaster: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  GameStatestics: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  ManualResultCarRoulete: async (req, res) => {

    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/revenue_report", {
      title: "Revenue Report",
      type: "revenue-report",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },

  PlayerManagementSystem: async (req, res) => {

    const allGameRecords = await AdminController.playerManagementSystem(10);
    // let allGameRecords =""
    res.render("admin/playerMgtSystem", {
      title: "Player Management System",
      type: "playerMgtSystem",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  Distributer: async (req, res) => {

    const allGameRecords = await AdminController.distributorData(10);
    // let allGameRecords =""
    res.render("admin/distributor", {
      title: "Distributor",
      type: "distributor",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords,
      total: allGameRecords.total,
    });
  },
  createDistributor: async (req, res) => {

    const data = req.admin
    res.render("admin/createDistributor", {
      title: "Create Distributer",
      type: "distributer",
      sub: "distributer",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  createRank: async (req, res) => {
    let rank_id = req.params.rank_id
    let updated = req.params.updated
    console.log(req.params);
    const data = await distributorController.showRankData(req, rank_id, updated)
    // console.log(data);
    // const data=req.admin
    res.render("admin/createRank", {
      title: "Create Rank",
      type: "distributer",
      sub: "distributer",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  editRank: async (req, res) => {
    let rank_id = req.params.rank_id
    let updated = req.params.updated
    // console.log(req.params);
    const data = await distributorController.editRankData(req, rank_id, updated)
    // console.log(data);
    // const data=req.admin
    res.render("admin/editRank", {
      title: "Edit Rank",
      type: "distributer",
      sub: "distributer",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  editDistributer: async (req, res) => {
    let rank_id = req.params.rank_id
    let updated = req.params.updated
    console.log(req.params);
    const data = await distributorController.editDistributerData(req, rank_id, updated)
    // console.log(data);
    // const data=req.admin
    res.render("admin/editDistributer", {
      title: "Edit Distributer",
      type: "distributer",
      sub: "distributer",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  manualCardRoullete: async (req, res) => {
    let role = "State"
    let adminData = req.admin
    const users = await AdminController.manualCardRoullete();
    res.render("admin/manulCardRoullete", {
      title: "Manual Result Card Roulette",
      type: "control",
      sub: "control",
      sub2: "carRoulleteReport",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users,
      // total: users.count,
      manual: false
    });
  },
  liveStaticsCardRoullete: async (req, res) => {
    let role = "State"
    let adminData = req.admin
    const users = await AdminController.manualCardRoullete();
    res.render("admin/liveCardRoulleteData", {
      title: "Live Statics of Card Roulette",
      type: "statics",
      sub: "statics",
      sub2: "cardstatics",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users,
      // total: users.count,
      manual: true
    });
  },
  liveStaticsAvaitor: async (req, res) => {
    let role = "State"
    let adminData = req.admin
    const users = await AdminController.liveAvaitorProfit();
    res.render("admin/avaitorLiveStatics", {
      title: "Live Statics of Avaitor",
      type: "statics",
      sub: "statics",
      sub2: "avaitor",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users,
      // total: users.count,
      manual: true
    });
  },
  roulleteStatics: async (req, res) => {
    let gameId = 1
    let adminData = req.admin
    const users = await AdminController.liveRoullete(adminData, gameId);
    res.render("admin/roulleteStatics", {
      title: "Live Statics of Roullete",
      type: "control",
      sub: "control",
      sub2: "carRoulleteReport",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users,
      // total: users.count,
    });
  },
  carRoulleteReport: async (req, res) => {
    const data = await distributorController.addRankssData(req)
    res.render("admin/commissionReport", {
      title: "Car Roulette",
      type: "commissionReport",
      sub: "commissionReport",
      sub2: "carRoulleteReport",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  roulleteReport: async (req, res) => {
    const data = await distributorController.addRankssData(req)
    res.render("admin/commissionReport", {
      title: "Roullete",
      type: "commissionReport",
      sub: "commissionReport",
      sub2: "roulleteReport",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  avaitorReport: async (req, res) => {
    const data = await distributorController.addRankssData(req)
    res.render("admin/commissionReport", {
      title: "Avaitor",
      type: "commissionReport",
      sub: "commissionReport",
      sub2: "avaitorReport",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  addStateRank: async (req, res) => {
    let role = "State"
    const data = await distributorController.addRankssData(req, role)
    res.render("admin/addRankCompany", {
      title: "Add Rank",
      type: "addRank",
      sub: "rank",
      sub2: "state",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  addDistrictRank: async (req, res) => {
    // let data = await noticeData.findOne({});
    let role = "District"
    const data = await distributorController.addRankssData(req, role)
    res.render("admin/addRankCompany", {
      title: "Add Rank",
      type: "addRank",
      sub: "rank",
      sub2: "district",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  addZoneRank: async (req, res) => {
    // let data = await noticeData.findOne({});
    let role = "Zone"
    const data = await distributorController.addRankssData(req, role)
    res.render("admin/addRankCompany", {
      title: "Add Rank",
      type: "addRank",
      sub: "rank",
      sub2: "zone",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  addAgentRank: async (req, res) => {
    // let data = await noticeData.findOne({});
    let role = "Agent"
    const data = await distributorController.addRankssData(req, role)
    res.render("admin/addRankCompany", {
      title: "Add Rank",
      type: "addRank",
      sub: "rank",
      sub2: "agent",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  adduserRank: async (req, res) => {
    // let data = await noticeData.findOne({});
    let role = "User"
    const data = await distributorController.addRankssData(req, role)
    res.render("admin/addRankCompany", {
      title: "Add Rank",
      type: "addRank",
      sub: "rank",
      sub2: "user",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  editNotice: async (req, res) => {

    // console.log(req.query)
    // console.log(req.params)
    let id = req.params.id
    const data = await distributorController.editUserData(req, id)

    res.render("admin/editNotice", {
      title: "Edit User",
      type: "addRank",
      sub: "dashboard",
      sub2: "create-user",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  editUser: async (req, res) => {
    role = "User"
    let id = req.params.id
    const data = await distributorController.addRankUserData(req, role, id)

    res.render("admin/editUser", {
      title: "Edit User",
      type: "addRank",
      sub: "dashboard",
      sub2: "create-user",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  betHistoryAvaitor: async (req, res) => {
    let game = "3"
    const transactions = await paymentController.betHistory(10, game);
    res.render("admin/betHistory", {
      title: "Slot History(Avaitor)",
      type: "bet",
      sub: "avaitor",
      sub2: "avaitor",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      game: game,
    });
  },
  betHistoryRoullete: async (req, res) => {
    let game = "1"
    const transactions = await paymentController.betHistory(10, game);
    res.render("admin/betHistory", {
      title: "Slot History(Roullete)",
      type: "bet",
      sub: "roullete",
      sub2: "roullete",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      game: game,
    });
  },
  betHistoryCardRoullete: async (req, res) => {
    let game = "2"
    const transactions = await paymentController.betHistory(10, game);
    res.render("admin/betHistory", {
      title: "Slot History (Card Roullete)",
      type: "bet",
      sub: "card",
      sub2: "card",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      game: game,
    });
  },
  modifyUser: async (req, res) => {
    const user = await AdminController.getUserDetails(
      req.params.id,
      req.admin._id
    );
    const data = await distributorController.modifyPlayerData(user)
    res.render("admin/modifyPlayer", {
      title: "Modify Player",
      type: "mPlayer",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  changeUserPass: async (req, res) => {
    const user = await AdminController.getUserDetails(
      req.params.id,
      req.admin._id
    );
    // console.log(user);
    const data = await distributorController.modifyPlayerData(user)
    console.log(data.user.username);
    res.render("admin/profile", {
      title: `Change Password (${data.user.name})`,
      type: "profile",
      sub: "profile",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  changeUserSPin: async (req, res) => {
    const user = await AdminController.getUserDetails(
      req.params.id,
      req.admin._id
    );
    const data = await distributorController.modifyPlayerData(user)
    res.render("admin/profile", {
      title: `Change Security Pin (${user.username})`,
      type: "profile",
      sub: "profile",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  rankMaster: async (req, res) => {
    // let data = await noticeData.findOne({});
    const data = await distributorController.showRankData(req)
    res.render("admin/rankMaster", {
      title: "Set User Creation Limits",
      type: "master",
      sub: "master",
      sub2: "rankM",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
      total: data.count,
    });

  },
  createUser: async (req, res) => {
    // let data = await noticeData.findOne({});
    role = "User"
    const data = await distributorController.addRankUserData(req, role)

    res.render("admin/createUserRank", {
      title: "Add User",
      type: "addRank",
      sub: "dashboard",
      sub2: "create-user",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  addRankss: async (req, res) => {
    // let data = await noticeData.findOne({});

    const data = await distributorController.addRankssData(req)

    res.render("admin/addRankCompany", {
      title: "Add Distributer",
      type: "addRank",
      sub: "dashboard",
      sub2: "addRankCompany",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },
  distributerMaster: async (req, res) => {
    // let data = await noticeData.findOne({});
    const allGameRecords = await AdminController.distributorData(10);
    res.render("admin/distributerMaster", {
      title: "Distributer Master",
      type: "Rank Management",
      sub: "rankMgt",
      sub2: "distM",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords,
      total: allGameRecords.total,
    });

  },
  commissionLimit: async (req, res) => {
    // let data = await noticeData.findOne({});
    if (req.admin.role == "Company") {
      const data = await distributorController.profitPercent(req)
      // console.log(req.admin);
      res.render("admin/profit-management", {
        title: "Set Game Profit",
        type: "master",
        sub: "master",
        sub2: "profit",
        host: config.pre + req.headers.host,
        admin: req.admin,
        data: data,
      });
    }
  },
  gameMgt: async (req, res) => {
    // let data = await noticeData.findOne({});
    if (req.admin.role == "Company") {
      const data = await distributorController.gameMgt(req)
      // console.log(req.admin);
      res.render("admin/gameMgt", {
        title: "Game Play/Pause",
        type: "master",
        sub: "master",
        sub2: "game-mgt",
        host: config.pre + req.headers.host,
        admin: req.admin,
        data: data,
      });
    }
  },
  commissionMgt: async (req, res) => {
    // let data = await noticeData.findOne({});
    if (req.admin.role == "Company") {
      const data = await distributorController.commission_management(req)
      // console.log(req.admin);
      res.render("admin/commission-mgt", {
        title: "Set Game Commission",
        type: "master",
        sub: "master",
        sub2: "commission-mgt",
        host: config.pre + req.headers.host,
        admin: req.admin,
        data: data,
      });
    }
  },

  sendNotice: async (req, res) => {
    try {
      const lastNotice = await noticeData.findOne().sort({ _id: -1 }).exec();
      res.send(lastNotice);
    } catch (error) {
      console.error("Error retrieving notice data:", error);
      res.status(500).send("Error retrieving notice data");
    }
  },
  distributors: async (req, res) => {
    const distributors = await distributorController.getDistributorsList(
      req,
      10
    );
    res.render("admin/distributor", {
      title: "Distributor List",
      type: "users",
      sub: "distributor",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: distributors.list,
      total: distributors.count,
    });
  },
  distributorDetail: async (req, res, next) => {
    const distributor = await distributorController.getDistributorsDetails(
      req,
      res
    );
    distributor.referred_agents = await distributorController.totalAgents(req);
    res.render("admin/view_distributor", {
      title: "Distributor Details",
      type: "users",
      sub: "distributor",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: distributor,
    });
  },
  addDistributorPage: async (req, res, next) => {
    res.render("admin/addDistributor", {
      title: "Add Distributor",
      type: "distributor",
      sub: "distributor",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
    });
  },
  agentDetail: async (req, res, next) => {
    let agent = await AgentController.getAgentDetails(req);
    agent.referred_users = await AgentController.totalUsers(agent._id);
    res.render("admin/view_agent", {
      title: "Agent Details",
      type: "agent",
      sub: "agent",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: agent,
    });
  },
  agents: async (req, res, next) => {
    const agents = await AgentController.getAgentsList(req, 10);
    res.render("admin/agent", {
      title: "Agent List",
      type: "users",
      sub: "agent",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: agents.list,
      total: agents.count,
    });
  },
  users: async (req, res) => {
    // console.log(req.admin)
    const users = await AdminController.getUsersList(req.admin);
    res.render("admin/user", {
      title: "User List",
      type: "usersMGT",
      sub: "users",
      sub2: "user",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
    });
  },
  onlineusers: async (req, res) => {
    // console.log(req.admin)
    let ids = req.query.userIds.split(",").map(Number)
    const users = await AdminController.getUsersListonline(req.admin, ids);
    res.render("admin/user", {
      title: "Online Users list",
      type: "usersMGT",
      sub: "users",
      sub2: "user",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
    });
  },
  agentsMGT: async (req, res) => {
    let role = "Agent"
    let adminData = req.admin
    const users = await AdminController.getAgentList(role, adminData);
    let Child = true
    if (req.admin.role == "Zone" || req.admin.role == "Company") {
      Child = false
    }
    res.render("admin/agentsMGT", {
      title: "Agents List",
      type: "usersMGT",
      sub: "users",
      sub2: "agents",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
      child: Child
    });
  },
  zoneMGT: async (req, res) => {
    let role = "Zone"
    let adminData = req.admin
    const users = await AdminController.getAgentList(role, adminData);
    let Child = true
    if (req.admin.role == "District" || req.admin.role == "Company") {
      Child = false
    }
    res.render("admin/agentsMGT", {
      title: "Zone List",
      type: "usersMGT",
      sub: "users",
      sub2: "zone",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
      child: Child
    });
  },
  districtMGT: async (req, res) => {
    let role = "District"
    let adminData = req.admin
    const users = await AdminController.getAgentList(role, adminData);
    let Child = true
    if (req.admin.role == "State" || req.admin.role == "Company") {
      Child = false
      console.log(Child);
    }
    res.render("admin/agentsMGT", {
      title: "District List",
      type: "usersMGT",
      sub: "users",
      sub2: "district",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
      child: Child
    });
  },
  stateMGT: async (req, res) => {
    let role = "State"
    let adminData = req.admin
    const users = await AdminController.getAgentList(role, adminData);
    // console.log(users.list);
    res.render("admin/agentsMGT", {
      title: "State List",
      type: "usersMGT",
      sub: "users",
      sub2: "state",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
      child: false
    });
  },
  showChild: async (req, res) => {
    console.log(req.params, req.query);
    let role = req.query.role
    let id = req.params.id
    const users = await AdminController.getChildList(id, role);
    res.render("admin/agentsMGT", {
      title: "Child List",
      type: "usersMGT",
      sub: "users",
      sub2: "child",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
      child: true
    });
  },
  showDetailOfSlot: async (req, res) => {
    // console.log(req.params,req.query);
    let roomId = req.params.id
    let gameId = req.params.gameId
    let admin = req.admin
    const users = await AdminController.getSlotDetails(roomId, gameId, admin);
    // console.log(users);
    res.render("admin/slotDetail", {
      title: "Slot Details",
      type: "usersMGT",
      sub: "users",
      sub2: "child",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users,
      total: users.length,
      child: true,
      gameId: gameId,
      roomId: roomId
    });
  },
  showDetailOfBet: async (req, res) => {
    // console.log(req.params,req.query);
    let roomId = req.params.id
    let gameId = req.params.gameId
    let admin = req.admin
    let userId = req.params.userId
    console.log(userId);
    const users = await AdminController.getSlotBetDetails(roomId, gameId, admin, userId);
    // console.log(users);
    res.render("admin/betDetail", {
      title: "Slot Bet Details",
      type: "usersMGT",
      sub: "users",
      sub2: "child",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users,
      total: users.length,
      child: true,
      gameId: gameId,
    });
  },
  kycRequests: async (req, res) => {
    const wr = await kycController.kycRequest();
    res.render("admin/kyc_view", {
      title: "KYC Request",
      type: "kyc",
      sub: "kycrequest",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: "hello",
      // data: wr.list,
      // total: wr.total,
    });
  },

  kycCompleted: async (req, res) => {
    const completed = await kycController.kycCompletedRequest();
    res.render("admin/kyc_completed_request", {
      title: "Completed Request",
      type: "kyccomplete",
      sub: "Kyc Request",
      sub2: "kycCompleted",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: completed.list,
      total: completed.total,
    });
  },
  kycRejected: async (req, res) => {
    const rejected = await kycController.kycRejectedRequest();
    res.render("admin/kyc_rejected_request", {
      title: "Rejected Request",
      type: "kycreject",
      sub: "Kyc Request",
      sub2: "kycRejected",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: rejected.list,
      total: rejected.total,
    });
  },

  profile: (req, res) => {
    res.render("admin/profile", {
      title: "Admin Profile",
      type: "profile",
      sub: "profile",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
    });
  },
  login: (req, res) => {
    res.render("admin/login", {
      title: "Admin Login",
      host: config.pre + req.headers.host,
      year: new Date().getFullYear(),
      project_title: config.project_name,
    });
  },
  userDetail: async (req, res) => {
    // console.log(req.params);
    const user = await AdminController.getUserDetails(
      req.params.id,
      req.admin._id
    );
    res.render("admin/view_user", {
      title: "User Details",
      type: "user",
      sub: "user",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: user,
      games: [],
    });
  },
  referralList: async (req, res) => {
    var data = await AdminController.getReferralList();
    res.render("admin/referral", {
      title: "Referral List",
      type: "referral",
      sub: "referral",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },

  maintenance: async (req, res) => {
    var data = {};
    // var options1 = "";
    // var options2 = "";
    // var options3 = "";

    // data = await AdminController.getAppVersion();

    // var included = data.fees["2"].split(",").map(Number);
    // var included2 = data.fees["4"].split(",").map(Number);
    // var included3 = data.fees.PVT.split(",").map(Number);

    // included.sort((a, b) => a - b);
    // included2.sort((a, b) => a - b);
    // included3.sort((a, b) => a - b);

    // if (included.length > 0) {
    //   included.forEach(function (Fees) {
    //     options1 +=
    //       "<option value='" + Fees + "' selected >" + Fees + " </option>";
    //   });
    // }
    // if (included2.length > 0) {
    //   included2.forEach(function (Fees) {
    //     options2 +=
    //       "<option value='" + Fees + "' selected >" + Fees + " </option>";
    //   });
    // }
    // if (included3.length > 0) {
    //   included3.forEach(function (Fees) {
    //     options3 +=
    //       "<option value='" + Fees + "' selected >" + Fees + " </option>";
    //   });
    // }
    res.render("admin/maintenance", {
      title: "Maintenance",
      type: "maintenance",
      sub: "maintenance",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
      // selected1: options1,
      // selected2: options2,
      // selected3: options3,
      selected1: "",
      selected2: "",
      selected3: "",
    });
  },

  notification: async (req, res) => {
    var data = {};
    data = await AdminController.getNotification(10);
    res.render("admin/notification", {
      title: "Notice Management",
      type: "notification",
      sub: "notification",
      sub2: "noticemanagement",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data.list,
      total: data.count,
    });
  },
  sendnotice: async (req, res) => {
    var data = {};
    data = await User.find();
    res.render("admin/sendnotice", {
      title: "Notification Management",
      type: "notification",
      sub: "notification",
      sub2: "Send Notification",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });
  },

  referralDetail: async (req, res) => {
    var is_validate = await Service.validateObjectId(req.params.id);
    if (!is_validate) {
      res.redirect("/admin/404");
    } else {
      var data = {};
      data.details = await AdminController.getReferralDetails(req.params.id);
      // console.log("data.details", data.details);
      var name = await AdminController.usernameById(req.params.id);
      res.render("admin/referral_view", {
        title: "Referral Details:" + " " + name,
        type: "referral",
        sub: "referral",
        sub2: "",
        host: config.pre + req.headers.host,
        admin: req.admin,
        data: data,
      });
    }
  },
  allTransactions: async (req, res) => {
    let admin = req.admin
    let type;
    if (req.query.id) {
      type = req.query.id
    } else {
      type = false
    }
    const transactions = await paymentController.transactionList(10, admin);
    res.render("admin/transaction", {
      title: "Wallet Transfer",
      type: "transaction",
      sub: "all",
      sub2: "",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      buttonWallete: type
    });
  },



  performance: async (req, res) => {
    let admin = req.admin
    let type;
    if (req.query.id) {
      type = req.query.id
    } else {
      type = false
    }

    const transactions = await paymentController.performanceList(10, admin);
    console.log("trancationnnnn000001-----------", transactions.count, transactions.list);

    res.render("admin/performance", {
      title: "Performance Report",
      type: "performance",
      sub: "all",
      sub2: "",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      buttonWallete: type
    });
  },

  settlement: async (req, res) => {
    let admin = req.admin
    let type;
    if (req.query.id) {
      type = req.query.id
    } else {
      type = false
    }
    const transactions = await paymentController.settlementList(10, admin);
    console.log("trancationnnnn00000-----------", transactions.count, transactions.list);
    res.render("admin/settlement", {
      title: "Settlement Report",
      type: "settlement",
      sub: "all",
      sub2: "",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
      buttonWallete: type
    });
  },

  allCommissionReport: async (req, res) => {
    let admin = req.admin
    // const transactions = await paymentController.transactionList(1, admin);
    res.render("admin/commissionData", {
      title: "Commission Report",
      type: "commrep",
      sub: "commrep",
      sub2: "report",
      total: 0,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: [],
    });
  },
  gameRecords: async (req, res) => {
    const allGameRecords = await AdminController.allGameRecords(10);
    // let allGameRecords =""
    res.render("admin/game_records", {
      title: "Game Records",
      type: "game",
      sub: "game",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: allGameRecords.list,
      total: allGameRecords.total,
    });
  },
  /* User Payout Pages */
  withdrawalRequests: async (req, res) => {
    const wr = await AdminController.withdrawalRequest();
    res.render("admin/withdrawal_request", {
      title: "Withdrawal Request",
      type: "payout",
      sub: "userPayout",
      sub2: "userWithdrawal",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: wr.list,
      total: wr.total,
    });
  },

  withdrawalCompleted: async (req, res) => {
    const completed = await AdminController.withdrawalCompletedRequest();
    res.render("admin/completed_request", {
      title: "Completed Request",
      type: "payout",
      sub: "userPayout",
      sub2: "userCompleted",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: completed.list,
      total: completed.total,
    });
  },
  withdrawalRejected: async (req, res) => {
    const rejected = await AdminController.withdrawalRejectedRequest();
    res.render("admin/rejected_request", {
      title: "Rejected Request",
      type: "payout",
      sub: "userPayout",
      sub2: "userRejected",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: rejected.list,
      total: rejected.total,
    });
  },
  /* Distributor Payout Pages */
  distWithdrawalRequests: async (req, res) => {
    const wr = await AdminController.distWithdrawalRequest();
    res.render("admin/dist_withdrawal_request", {
      title: "Withdrawal Request",
      type: "payout",
      sub: "distributorPayout",
      sub2: "distributorWithdrawal",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: wr.list,
      total: wr.total,
    });
  },
  distWithdrawalCompleted: async (req, res) => {
    const completed = await AdminController.distWithdrawalCompletedRequest();
    res.render("admin/dist_completed_request", {
      title: "Completed Request",
      type: "payout",
      sub: "distributorPayout",
      sub2: "distributorCompleted",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: completed.list,
      total: completed.total,
    });
  },
  distWithdrawalRejected: async (req, res) => {
    const rejected = await AdminController.distWithdrawalRejectedRequest();
    res.render("admin/dist_rejected_request", {
      title: "Rejected Request",
      type: "payout",
      sub: "distributorPayout",
      sub2: "distributorRejected",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: rejected.list,
      total: rejected.total,
    });
  },
  /* Agent Payout Pages */
  agentWithdrawalRequest: async (req, res, next) => {
    const wr = await AdminController.agentWithdrawalRequest(req);
    res.render("admin/agent_withdrawal_request", {
      title: "Withdrawal Request",
      type: "payout",
      sub: "agentPayout",
      sub2: "agentWithdrawal",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: wr.list,
      total: wr.total,
    });
  },
  agentWithdrawalCompleted: async (req, res, next) => {
    const completed = await AdminController.agentWithdrawalCompleted();
    res.render("admin/agent_completed_request", {
      title: "Completed Request",
      type: "payout",
      sub: "agentPayout",
      sub2: "agentCompleted",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: completed.list,
      total: completed.total,
    });
  },
  agentWithdrawalRejected: async (req, res, next) => {
    const rejected = await AdminController.agentWithdrawalRejected();
    res.render("admin/agent_rejected_request", {
      title: "Rejected Request",
      type: "payout",
      sub: "agentPayout",
      sub2: "agentRejected",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: rejected.list,
      total: rejected.total,
    });
  },
  pageNotFound: (req, res) => {
    res.render("admin/404", {
      title: "404 Error",
      type: "404",
      sub: "404",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
    });
  },
  Unauthorized: (req, res) => {
    res.render("admin/401", {
      title: "401 Unauthorized!",
      type: "401",
      sub: "401",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
    });
  },

  blogList: async (req, res) => {
    const blogs = await blogController.bloglist();
    res.render("admin/blog", {
      title: "Blog Management",
      type: "blog",
      sub: "blog",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: "hello",
      // data: wr.list,
      // total: wr.total,
    });
  },

  blogAdd: async (req, res, next) => {
    res.render("admin/addBlog", {
      title: "Add Blog",
      type: "blog",
      sub: "blog",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
    });
  },

  blogEdit: async (req, res, next) => {
    var query = { _id: req.params.id };

    const blog = await Blogs.findOne(query);
    blog.image = blog.image.replace("./public", "");
    console.log(blog);
    res.render("admin/editBlog", {
      title: "Edit Blog",
      type: "blog",
      sub: "blog",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: blog,
    });
  },
  // Banner management
  bannerList: async (req, res, next) => {
    const banner = await adminController.bannerList(
      req,
      10
    );
    res.render("admin/banners", {
      title: "Banner List",
      type: "Banner",
      sub: "Banner List",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: banner.list,
      total: banner.count,
    });
  },
  addBannerPage: async (req, res, next) => {
    res.render("admin/addBanner", {
      title: "Add Banner",
      type: "Banner",
      sub: "Add Banner",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
    });
  },
  getAllData: async function (req, res) {
    console.time()
    let a = null
    let b = null
    let state_data = [];
    let district_data = [];
    let Zone_data = [];
    let agent_data = [];
    let user_data = [];
    let _ids = []
    let data = await distributorController.commission_management(req)
    let result = []

    let avaitor_margin = 0
    let car_roulette_margin = 0
    let roulette_margin = 0
    let aviator_marginend = 0
    let car_roulette_marginend = 0
    let roulette_marginend = 0
    let margin = 0

    let avaitor_endPoint = 0
    let car_roulette_endPoint = 0
    let roulette_endPoint = 0


    // console.log("req---------------");
    let company_data = await User.aggregate([ {
      $match: {
        role: "Company"
      }
    },
    {
      $project: {
        _id: 1
      }
    } ]

    )


    for (var i = 0; i < company_data.length; i++) {
      let userIDs = [ company_data[ i ]._id ];
      let users = await User.find({ parent: company_data[ i ]._id }, { _id: 1 }).lean();
      while (users.length > 0) {
        const userIdsArray = users.map(({ _id }) => _id);
        userIDs.push(...userIdsArray);
        users = await User.find({ parent: { $in: userIdsArray } }, { _id: 1 }).lean();
      }

      state_data = await User.find({ parent: company_data[ i ]._id })
      for (var j = 0; j < state_data.length; j++) {
        let userIDs = [ state_data[ j ]._id ];
        let users = await User.find({ parent: state_data[ j ]._id }, { _id: 1 }).lean();
        while (users.length > 0) {
          const userIdsArray = users.map(({ _id }) => _id);
          userIDs.push(...userIdsArray);
          users = await User.find({ parent: { $in: userIdsArray } }, { _id: 1 }).lean();
        }

        district_data = await User.find({ parent: state_data[ j ]._id })

        for (let k = 0; k < district_data.length; k++) {



          Zone_data = await User.find({ parent: district_data[ k ]._id })
          let userIDs = [ district_data[ k ]._id ];
          let users = await User.find({ parent: district_data[ k ]._id }, { _id: 1 }).lean();
          while (users.length > 0) {
            const userIdsArray = users.map(({ _id }) => _id);
            userIDs.push(...userIdsArray);
            users = await User.find({ parent: { $in: userIdsArray } }, { _id: 1 }).lean();
          }

          for (let l = 0; l < Zone_data.length; l++) {

            let userIDs = [ Zone_data[ l ]._id ];
            let users = await User.find({ parent: Zone_data[ l ]._id }, { _id: 1 }).lean();
            while (users.length > 0) {
              const userIdsArray = users.map(({ _id }) => _id);
              userIDs.push(...userIdsArray);
              users = await User.find({ parent: { $in: userIdsArray } }, { _id: 1 }).lean();
            }

            agent_data = await User.find({ parent: Zone_data[ l ]._id })


            for (let m = 0; m < agent_data.length; m++) {

              let userIDs = [ agent_data[ m ]._id ];
              let users = await User.find({ parent: agent_data[ m ]._id }, { _id: 1 }).lean();
              while (users.length > 0) {
                const userIdsArray = users.map(({ _id }) => _id);
                userIDs.push(...userIdsArray);
                users = await User.find({ parent: { $in: userIdsArray } }, { _id: 1 }).lean();
              }

              user_data = await User.find({ parent: agent_data[ m ]._id })



              for (let n = 0; n < user_data.length; n++) {

                totalPoints = await User.aggregate([ {
                  $match: {
                    _id: user_data[ n ]._id,
                    role: "User"
                  }
                },
                {
                  $group: {
                    _id: null,
                    avaitor_totalplaypoint: { $sum: "$avaitor_totalplaypoint" },
                    carRoulette_totalplaypoint: { $sum: "$carRoulette_totalplaypoint" },
                    roulette_totalplaypoint: { $sum: "$roulette_totalplaypoint" },
                    avaitor_totalwinningpoint: { $sum: "$avaitor_totalwinningpoint" },
                    carRoulette_totalwinningpoint: { $sum: "$carRoulette_totalwinningpoint" },
                    roulette_totalwinningpoint: { $sum: "$roulette_totalwinningpoint" },

                  },
                } ]);

                if (totalPoints.length > 0) {

                  a = totalPoints[ 0 ].avaitor_totalplaypoint + totalPoints[ 0 ].carRoulette_totalplaypoint + totalPoints[ 0 ].roulette_totalplaypoint
                  b = totalPoints[ 0 ].avaitor_totalwinningpoint + totalPoints[ 0 ].carRoulette_totalwinningpoint + totalPoints[ 0 ].roulette_totalwinningpoint
                  totalPoints[ 0 ] = { totalPlayPoint: a, totalWinningPoint: b }
                }

                const {
                  totalPlayPoint = 0,
                  totalWinningPoint = 0,
                } = totalPoints[ 0 ] || {};

                const endPoint = totalPlayPoint - totalWinningPoint;


                let saveData = new Updated_stats({
                  role: "User",
                  user_id: user_data[ n ]._id,
                  total_play_point: totalPlayPoint,
                  total_win_point: totalWinningPoint,
                  total_end_point: endPoint,
                  search_id: user_data[ i ]?.search_id

                });

                let res = await saveData.save()
                _ids.push(user_data[ n ]._id)

              }
              totalPoints = await User.aggregate([ {
                $match: {
                  _id: { $in: userIDs },
                  role: "User",
                },
              },
              {
                $group: {
                  _id: null,
                  avaitor_totalplaypoint: {
                    $sum: "$avaitor_totalplaypoint",
                  },
                  carRoulette_totalplaypoint: {
                    $sum: "$carRoulette_totalplaypoint",
                  },
                  roulette_totalplaypoint: {
                    $sum: "$roulette_totalplaypoint",
                  },
                  avaitor_totalwinningpoint: {
                    $sum: "$avaitor_totalwinningpoint",
                  },
                  carRoulette_totalwinningpoint: {
                    $sum: "$carRoulette_totalwinningpoint",
                  },
                  roulette_totalwinningpoint: {
                    $sum: "$roulette_totalwinningpoint",
                  },
                },
              }, ]);

              if (totalPoints.length > 0) {

                a = totalPoints[ 0 ].avaitor_totalplaypoint + totalPoints[ 0 ].carRoulette_totalplaypoint + totalPoints[ 0 ].roulette_totalplaypoint
                b = totalPoints[ 0 ].avaitor_totalwinningpoint + totalPoints[ 0 ].carRoulette_totalwinningpoint + totalPoints[ 0 ].roulette_totalwinningpoint
                avaitor_endPoint = Number(totalPoints[ 0 ].avaitor_totalplaypoint - totalPoints[ 0 ].avaitor_totalwinningpoint)
                car_roulette_endPoint = Number(totalPoints[ 0 ].carRoulette_totalplaypoint - totalPoints[ 0 ].carRoulette_totalwinningpoint)
                roulette_endPoint = Number(totalPoints[ 0 ].roulette_totalplaypoint - totalPoints[ 0 ].roulette_totalwinningpoint)
                totalPoints[ 0 ] = { totalPlayPoint: a, totalWinningPoint: b }
              }

              const {
                totalPlayPoint = 0,
                totalWinningPoint = 0,
              } = totalPoints[ 0 ] || {};

              const endPoint = totalPlayPoint - totalWinningPoint;
              let result = []
              for (let key in data) {
                result = result.concat(data[ key ].filter(obj => obj.rankName == 'Agent'));
              }


              avaitor_margin = result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
              car_roulette_margin = result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
              roulette_margin = result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission

              aviator_marginend = (avaitor_endPoint * avaitor_margin) / 100
              car_roulette_marginend = (car_roulette_endPoint * car_roulette_margin) / 100
              roulette_marginend = (roulette_endPoint * roulette_margin) / 100
              margin = aviator_marginend + car_roulette_marginend + roulette_marginend




              let saveData = new Updated_stats({
                role: "Agent",
                user_id: agent_data[ m ]._id.toString(),
                total_play_point: totalPlayPoint,
                total_win_point: totalWinningPoint,
                total_end_point: endPoint,
                total_margin: margin,
                total_net_margin: endPoint - margin,
                search_id: agent_data[ m ].search_id

              });
              let res = await saveData.save()
              _ids.push(agent_data[ m ]._id.toString())


            }
            totalPoints = await User.aggregate([ {
              $match: {
                _id: { $in: userIDs }
              }
            },
            {
              $group: {
                _id: null,
                avaitor_totalplaypoint: { $sum: "$avaitor_totalplaypoint" },
                carRoulette_totalplaypoint: { $sum: "$carRoulette_totalplaypoint" },
                roulette_totalplaypoint: { $sum: "$roulette_totalplaypoint" },
                avaitor_totalwinningpoint: { $sum: "$avaitor_totalwinningpoint" },
                carRoulette_totalwinningpoint: { $sum: "$carRoulette_totalwinningpoint" },
                roulette_totalwinningpoint: { $sum: "$roulette_totalwinningpoint" },

              },
            } ]);

            if (totalPoints.length > 0) {

              a = totalPoints[ 0 ].avaitor_totalplaypoint + totalPoints[ 0 ].carRoulette_totalplaypoint + totalPoints[ 0 ].roulette_totalplaypoint
              b = totalPoints[ 0 ].avaitor_totalwinningpoint + totalPoints[ 0 ].carRoulette_totalwinningpoint + totalPoints[ 0 ].roulette_totalwinningpoint
              avaitor_endPoint = Number(totalPoints[ 0 ].avaitor_totalplaypoint - totalPoints[ 0 ].avaitor_totalwinningpoint)
              car_roulette_endPoint = Number(totalPoints[ 0 ].carRoulette_totalplaypoint - totalPoints[ 0 ].carRoulette_totalwinningpoint)
              roulette_endPoint = Number(totalPoints[ 0 ].roulette_totalplaypoint - totalPoints[ 0 ].roulette_totalwinningpoint)
              totalPoints[ 0 ] = { totalPlayPoint: a, totalWinningPoint: b }
            }

            const {
              totalPlayPoint = 0,
              totalWinningPoint = 0,
            } = totalPoints[ 0 ] || {};

            const endPoint = totalPlayPoint - totalWinningPoint;
            let result = []
            for (let key in data) {
              result = result.concat(data[ key ].filter(obj => obj.rankName == 'Agent'));
            }
            let own_commission = [];
            for (let key in data) {
              own_commission = own_commission.concat(data[ key ].filter(obj => obj.rankName === 'Zone'));
            }

            avaitor_margin = own_commission.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
            car_roulette_margin = own_commission.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
            roulette_margin = own_commission.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission

            aviator_marginend = (avaitor_endPoint * avaitor_margin) / 100
            car_roulette_marginend = (car_roulette_endPoint * car_roulette_margin) / 100
            roulette_marginend = (roulette_endPoint * roulette_margin) / 100
            margin = aviator_marginend + car_roulette_marginend + roulette_marginend


            avaitor_margin = result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
            car_roulette_margin = result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
            roulette_margin = result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission

            aviator_marginend = (avaitor_endPoint * avaitor_margin) / 100
            car_roulette_marginend = (car_roulette_endPoint * car_roulette_margin) / 100
            roulette_marginend = (roulette_endPoint * roulette_margin) / 100
            let child_margin = aviator_marginend + car_roulette_marginend + roulette_marginend
            let child_net_margin = endPoint - child_margin
            let net_margin = child_net_margin - margin


            let saveData = new Updated_stats({
              role: "Zone",
              user_id: Zone_data[ l ]._id,
              total_play_point: totalPlayPoint,
              total_win_point: totalWinningPoint,
              total_end_point: endPoint,
              total_margin: margin,
              total_net_margin: net_margin,
              search_id: Zone_data[ l ].search_id

            });

            let res = await saveData.save()
            _ids.push(Zone_data[ l ]._id.toString())


          }
          totalPoints = await User.aggregate([ {
            $match: {
              _id: { $in: userIDs },
            }
          },
          {
            $group: {
              _id: null,
              avaitor_totalplaypoint: { $sum: "$avaitor_totalplaypoint" },
              carRoulette_totalplaypoint: { $sum: "$carRoulette_totalplaypoint" },
              roulette_totalplaypoint: { $sum: "$roulette_totalplaypoint" },
              avaitor_totalwinningpoint: { $sum: "$avaitor_totalwinningpoint" },
              carRoulette_totalwinningpoint: { $sum: "$carRoulette_totalwinningpoint" },
              roulette_totalwinningpoint: { $sum: "$roulette_totalwinningpoint" },

            },
          } ]);

          if (totalPoints.length > 0) {

            a = totalPoints[ 0 ].avaitor_totalplaypoint + totalPoints[ 0 ].carRoulette_totalplaypoint + totalPoints[ 0 ].roulette_totalplaypoint
            b = totalPoints[ 0 ].avaitor_totalwinningpoint + totalPoints[ 0 ].carRoulette_totalwinningpoint + totalPoints[ 0 ].roulette_totalwinningpoint
            avaitor_endPoint = Number(totalPoints[ 0 ].avaitor_totalplaypoint - totalPoints[ 0 ].avaitor_totalwinningpoint)
            car_roulette_endPoint = Number(totalPoints[ 0 ].carRoulette_totalplaypoint - totalPoints[ 0 ].carRoulette_totalwinningpoint)
            roulette_endPoint = Number(totalPoints[ 0 ].roulette_totalplaypoint - totalPoints[ 0 ].roulette_totalwinningpoint)
            totalPoints[ 0 ] = { totalPlayPoint: a, totalWinningPoint: b }
          }

          const {
            totalPlayPoint = 0,
            totalWinningPoint = 0,
          } = totalPoints[ 0 ] || {};

          const endPoint = totalPlayPoint - totalWinningPoint;

          let result = []
          for (let key in data) {
            result = result.concat(data[ key ].filter(obj => obj.rankName == 'Zone'));
          }
          let own_commission = [];
          for (let key in data) {
            own_commission = own_commission.concat(data[ key ].filter(obj => obj.rankName === 'District'));
          }

          let child_result = []
          for (let key in data) {
            child_result = own_commission.concat(data[ key ].filter(obj => obj.rankName === 'Agent'));
          }


          avaitor_margin = own_commission.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
          car_roulette_margin = own_commission.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
          roulette_margin = own_commission.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission


          aviator_marginend = (avaitor_endPoint * avaitor_margin) / 100
          car_roulette_marginend = (car_roulette_endPoint * car_roulette_margin) / 100
          roulette_marginend = (roulette_endPoint * roulette_margin) / 100
          margin = aviator_marginend + car_roulette_marginend + roulette_marginend


          avaitor_margin = child_result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
          car_roulette_margin = child_result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
          roulette_margin = child_result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission

          aviator_marginend = (avaitor_endPoint * avaitor_margin) / 100
          car_roulette_marginend = (car_roulette_endPoint * car_roulette_margin) / 100
          roulette_marginend = (roulette_endPoint * roulette_margin) / 100
          let agent_margin = aviator_marginend + car_roulette_marginend + roulette_marginend

          let agent_net_margin = endPoint - agent_margin
          let avaitor_child_margin = result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission - child_result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
          let car_child_roulette_margin = result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission - child_result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
          let roulette_child_margin = result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission - child_result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission


          aviator_marginend = (avaitor_endPoint * avaitor_child_margin) / 100
          car_roulette_marginend = (car_roulette_endPoint * car_child_roulette_margin) / 100
          roulette_marginend = (roulette_endPoint * roulette_child_margin) / 100
          child_margin = aviator_marginend + car_roulette_marginend + roulette_marginend
          let zone_net_margin = agent_net_margin - child_margin
          let net_margin = zone_net_margin - margin
          let saveData = new Updated_stats({
            role: "District",
            user_id: district_data[ k ]._id,
            total_play_point: totalPlayPoint,
            total_win_point: totalWinningPoint,
            total_end_point: endPoint,
            total_margin: margin,
            total_net_margin: net_margin,
            search_id: district_data[ k ].search_id


          });

          let res = await saveData.save()
          _ids.push(district_data[ k ]._id.toString())
          // console.log("res--------------", res);
        }
        totalPoints = await User.aggregate([ {
          $match: {
            _id: { $in: userIDs }
          }
        },
        {
          $group: {
            _id: null,
            avaitor_totalplaypoint: { $sum: "$avaitor_totalplaypoint" },
            carRoulette_totalplaypoint: { $sum: "$carRoulette_totalplaypoint" },
            roulette_totalplaypoint: { $sum: "$roulette_totalplaypoint" },
            avaitor_totalwinningpoint: { $sum: "$avaitor_totalwinningpoint" },
            carRoulette_totalwinningpoint: { $sum: "$carRoulette_totalwinningpoint" },
            roulette_totalwinningpoint: { $sum: "$roulette_totalwinningpoint" },

          },
        } ]);

        if (totalPoints.length > 0) {

          a = totalPoints[ 0 ].avaitor_totalplaypoint + totalPoints[ 0 ].carRoulette_totalplaypoint + totalPoints[ 0 ].roulette_totalplaypoint
          b = totalPoints[ 0 ].avaitor_totalwinningpoint + totalPoints[ 0 ].carRoulette_totalwinningpoint + totalPoints[ 0 ].roulette_totalwinningpoint
          avaitor_endPoint = Number(totalPoints[ 0 ].avaitor_totalplaypoint - totalPoints[ 0 ].avaitor_totalwinningpoint)
          car_roulette_endPoint = Number(totalPoints[ 0 ].carRoulette_totalplaypoint - totalPoints[ 0 ].carRoulette_totalwinningpoint)
          roulette_endPoint = Number(totalPoints[ 0 ].roulette_totalplaypoint - totalPoints[ 0 ].roulette_totalwinningpoint)
          totalPoints[ 0 ] = { totalPlayPoint: a, totalWinningPoint: b }
        }

        const {
          totalPlayPoint = 0,
          totalWinningPoint = 0,
        } = totalPoints[ 0 ] || {};

        const endPoint = totalPlayPoint - totalWinningPoint;

        let result = []
        for (let key in data) {
          result = result.concat(data[ key ].filter(obj => obj.rankName == 'District'));
        }
        let own_commission = [];
        for (let key in data) {
          own_commission = own_commission.concat(data[ key ].filter(obj => obj.rankName == 'State'));
        }

        let child_result = []
        for (let key in data) {
          child_result = child_result.concat(data[ key ].filter(obj => obj.rankName === 'Agent'));
        }


        avaitor_margin = own_commission.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
        car_roulette_margin = own_commission.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
        roulette_margin = own_commission.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission - result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission

        aviator_marginend = (avaitor_endPoint * avaitor_margin) / 100
        car_roulette_marginend = (car_roulette_endPoint * car_roulette_margin) / 100
        roulette_marginend = (roulette_endPoint * roulette_margin) / 100
        margin = aviator_marginend + car_roulette_marginend + roulette_marginend

        avaitor_margin = child_result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
        car_roulette_margin = child_result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
        roulette_margin = child_result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission

        aviator_marginend = (avaitor_endPoint * avaitor_margin) / 100
        car_roulette_marginend = (car_roulette_endPoint * car_roulette_margin) / 100
        roulette_marginend = (roulette_endPoint * roulette_margin) / 100
        let agent_margin = aviator_marginend + car_roulette_marginend + roulette_marginend

        let agent_net_margin = endPoint - agent_margin
        let avaitor_child_margin = result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission - child_result.filter(item => item.commissionData.gameId === 3)[ 0 ].commissionData.availableCommission
        let car_child_roulette_margin = result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission - child_result.filter(item => item.commissionData.gameId === 2)[ 0 ].commissionData.availableCommission
        let roulette_child_margin = result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission - child_result.filter(item => item.commissionData.gameId === 1)[ 0 ].commissionData.availableCommission


        aviator_marginend = (avaitor_endPoint * avaitor_child_margin) / 100
        car_roulette_marginend = (car_roulette_endPoint * car_child_roulette_margin) / 100
        roulette_marginend = (roulette_endPoint * roulette_child_margin) / 100
        child_margin = aviator_marginend + car_roulette_marginend + roulette_marginend
        let zone_net_margin = agent_net_margin - child_margin
        let net_margin = zone_net_margin - margin


        let saveData = new Updated_stats({
          role: "State",
          user_id: state_data[ j ]._id,
          total_play_point: totalPlayPoint,
          total_win_point: totalWinningPoint,
          total_end_point: endPoint,
          total_margin: margin,
          total_net_margin: net_margin,
          search_id: state_data[ j ].search_id


        });

        let res = await saveData.save()

      }

      totalPoints = await User.aggregate([ {
        $match: {
          _id: { $in: userIDs },
        }
      },
      {
        $group: {
          _id: null,
          avaitor_totalplaypoint: { $sum: "$avaitor_totalplaypoint" },
          carRoulette_totalplaypoint: { $sum: "$carRoulette_totalplaypoint" },
          roulette_totalplaypoint: { $sum: "$roulette_totalplaypoint" },
          avaitor_totalwinningpoint: { $sum: "$avaitor_totalwinningpoint" },
          carRoulette_totalwinningpoint: { $sum: "$carRoulette_totalwinningpoint" },
          roulette_totalwinningpoint: { $sum: "$roulette_totalwinningpoint" },

        },
      } ]);

      if (totalPoints.length > 0) {

        a = totalPoints[ 0 ].avaitor_totalplaypoint + totalPoints[ 0 ].carRoulette_totalplaypoint + totalPoints[ 0 ].roulette_totalplaypoint
        b = totalPoints[ 0 ].avaitor_totalwinningpoint + totalPoints[ 0 ].carRoulette_totalwinningpoint + totalPoints[ 0 ].roulette_totalwinningpoint
        totalPoints[ 0 ] = { totalPlayPoint: a, totalWinningPoint: b }
      }

      const {
        totalPlayPoint = 0,
        totalWinningPoint = 0,
      } = totalPoints[ 0 ] || {};

      const endPoint = totalPlayPoint - totalWinningPoint;


      // let saveData = new Updated_stats({
      //   role: "Company",
      //   user_id: company_data[ i ]._id,
      //   total_play_point: totalPlayPoint,
      //   total_win_point: totalWinningPoint,
      //   total_end_point: endPoint,
      //   search_id: company_data[ i ].search_id


      // });

      // let res = await saveData.save()
    }
    console.timeEnd()




  }
}