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
var { User } = require("../models/user"),
  Table = require("../models/table"),
  { Blogs } = require("../models/blogs");
const adminController = require("./adminController");

module.exports = {
  dashboard: async (req, res) => {
    var data = {};
    data.distributor_count = await distributorController.getAllDistributorCount(
      req
    );
    data.user_count = await AdminController.getAllUserCount();
    data.fb_user_count = await AdminController.getAllFBUserCount();
    data.guest_count = await AdminController.getAllGuestUserCount();
    data.game_count = await AdminController.getAllGameCount();
    data.most_preferred = await AdminController.mostPreferredAmount();
    data.latest_user = await AdminController.latestUser();
    data.graph_data = await AdminController.chartData();
    data.deposit = await AdminController.getDepositCount();
    data.withdrawl = await AdminController.getWithdrawlCount();
    data.referral = await AdminController.getReferralCount();
    data.total_state = await AdminController.getTotal_state();
    data.total_district = await AdminController.getTotal_district();
    data.total_agent = await AdminController.getTotal_agent();
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
  addRank: async (req, res) => {
    // let data = await noticeData.findOne({});
    const data = await distributorController.addRankData(req)
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
  addRank: async (req, res) => {
    // let data = await noticeData.findOne({});
    const data = await distributorController.addRankData(req)
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
  commissionMgt: async (req, res) => {
    // let data = await noticeData.findOne({});
    if(req.admin.role=="Company"){
    const data = await distributorController.commission_management(req)
    // console.log(req.admin);
    res.render("admin/commission-mgt", {
      title: "Commission Management",
      type: "commission-mgt",
      sub: "dashboard",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: data,
    });}
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
  distributors: async (req,res) => {
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
    const users = await AdminController.getUsersList();
    res.render("admin/user", {
      title: "User List",
      type: "users",
      sub: "user",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: users.list,
      total: users.count,
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
    const transactions = await paymentController.transactionList(10);
    res.render("admin/transaction", {
      title: "All transactions",
      type: "transaction",
      sub: "all",
      sub2: "",
      total: transactions.count,
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: transactions.list,
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
      total : banner.count,
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
};
