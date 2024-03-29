var UserController = require("../api/controller/userController");
var AdminController = require("../api/controller/adminController");
var AdminPagesController = require("../api/controller/adminPagesController");
var paymentController = require("../api/controller/paymentController");
var DistributorController = require("../api/controller/distributorController");
var AgentController = require("../api/controller/agentController");
var FrontController = require("../api/controller/FrontController");

var Service = require("../api/service");
var logger = require("../api/service/logger");
var config = require("../config");
var Table = require("../api/models/table");
const kycController = require("../api/controller/kycController");
const blogController = require("../api/controller/blogController");

module.exports = function (router, io) {
  router.get(
    "/user/view/:id",
    Service.authenticateAdmin,
    AdminPagesController.userDetail
  );
  router.get(
    "/user/addRank/:id",
    Service.authenticateAdmin,
    AdminPagesController.addRank
  );
  router.get(
    "/user/changePinPass/:id",
    Service.authenticateAdmin,
    AdminPagesController.changePinPass
  );
  router.get(
    "/user/showChild/:id",
    Service.authenticateAdmin,
    AdminPagesController.showChild
  );
  router.get(
    "/user/showSlotDetail/:id/:gameId",
    Service.authenticateAdmin,
    AdminPagesController.showDetailOfSlot
  );
  router.get(
    "/user/modify-user/:id",
    Service.authenticateAdmin,
    AdminPagesController.modifyUser
  );
  router.get(
    "/user/edit-user/:id",
    Service.authenticateAdmin,
    AdminPagesController.editUser
  );
  router.get(
    "/user/edit-notice/:id",
    Service.authenticateAdmin,
    AdminPagesController.editNotice
  );
  router.get(
    "/user/change-password-user/:id",
    Service.authenticateAdmin,
    AdminPagesController.changeUserPass
  );
  router.get(
    "/user/change-security-pin-user/:id",
    Service.authenticateAdmin,
    AdminPagesController.changeUserSPin
  );
  // router.get(
  //   "/user/createDistributor/:id",
  //   Service.authenticateAdmin,
  //   AdminPagesController.createDistributor
  // );
  router.get(
    "/user/createDistributor",
    Service.authenticateAdmin,
    AdminPagesController.createDistributor
  );
  router.get(
    "/user/createRank",
    Service.authenticateAdmin,
    AdminPagesController.createRank
  );
  router.get(
    "/user/createRanks/:rank_id",
    Service.authenticateAdmin,
    AdminPagesController.editRank
  );
  router.get(
    "/user/editDistributer/:rank_id",
    Service.authenticateAdmin,
    AdminPagesController.editDistributer
  );

  //frontend routes
  // router.get("/", FrontController.index);
  //============================When add Static Website please uncomment this=============================
  // router.get("/", (req,res)=>{
  //   res.render("front/home")
  // });
   //============================When add Static Website please uncomment this=============================
  // router.get("/aboutus", FrontController.about);
  // router.get("/contactus", FrontController.contact);
  // router.get("/services", FrontController.service);
  // router.get("/privacy_policy", FrontController.privacy_policy);
  // router.get("/terms_and_conditions", FrontController.t$C);
  // router.get("/refund_policy", FrontController.refundPolicy);
  router.get("/home",(req,res)=>{
    res.render("front/home")
  })
  router.get("/about",(req,res)=>{
    res.render("front/about")
  })
  router.get("/service",(req,res)=>{
    res.render("front/service")
  })
  router.get("/contact",(req,res)=>{
    res.render("front/contact")
  })
  router.get("/privacy-policy",(req,res)=>{
    res.render("front/privacy-policy")
  })
  router.get("/terms-condition",(req,res)=>{
    res.render("front/terms-condition")
  })
  router.get("/refund-policy",(req,res)=>{
    res.render("front/refund-policy")
  })
  router.get("/blog_ludo_cash/:id", FrontController.findBlog);
  router.post("/send_contact_email/", function (req, res) {
    return FrontController.SendEmail(req, res);
  });
  router.get("/blog_ludo_cash", function (req, res) {
    res.redirect("/");
  });
  router.use(Service.authenticateAdmin);

  // BASIC ROUTES
  router.get("/dashboard", AdminPagesController.dashboard);
  router.get("/admin", AdminPagesController.dashboard);
  router.get("/admin/login", AdminPagesController.login);
  router.get("/profile", AdminPagesController.profile);
  router.post("/admin/login", AdminController.login);
  router.post("/admin/genprofile", AdminController.updateAdminProfile);
  router.post("/admin/adminpass", AdminController.updateAdminProfilePass);
  router.post("/admin/userpass", AdminController.updateUserProfilePass);
  router.post("/admin/adminSP", AdminController.updateAdminSP);
  router.post("/admin/userSP", AdminController.updateUserSP);
  router.get("/admin/logout", AdminController.logout);

  // USER MANAGEMENT
  router.get("/user", AdminPagesController.users);
  router.get("/agentsMGT", AdminPagesController.agentsMGT);
  router.get("/zoneMGT", AdminPagesController.zoneMGT);
  router.get("/districtMGT", AdminPagesController.districtMGT);
  router.get("/stateMGT", AdminPagesController.stateMGT);
  router.post("/admin/getRanks", AdminController.getRanks);
  router.post("/admin/addmoney", AdminController.addMoneyByAdmin);
  router.post("/admin/users/change_status", UserController.updateStatus);
  router.post(
    "/admin/users/changeuserpass",
    AdminController.updateUserPassword
  );
  router.post("/admin/deductmoney", AdminController.deductMoneyByAdmin);
  router.post("/admin/users/manually_verify", AdminController.manuallyVerify);
  router.get("/users_ajax", UserController.getUserListAjax);

  router.get("/kycrequest", AdminPagesController.kycRequests);
  router.get("/kyc_ajax", kycController.kycAjax);
  router.post("/admin/kyc/request", (req, res) => {
    return kycController.kycRequestProcess(req, res, io);
  });
  router.get("/kyc_completed", AdminPagesController.kycCompleted);
  router.get("/kyc_completed_ajax", kycController.kycCompletedAjax);
  router.get("/kyc_rejected", AdminPagesController.kycRejected);
  // router.get("/kyc_rejected_ajax", kycController.kycRejectedAjax);
  // router.post("/export_kyc_request", kycController.exportWithdrawal);
  // router.post("/export_kyc_completed_request", kycController.exportCompleted);
  // router.post("/admin/withdrawal/request_multiple", (req, res) => {
  //   return AdminController.withdrawalRequestProcessMultiple(req, res, io);
  // });

  router.get("/blog", AdminPagesController.blogList);
  router.get("/blog_ajax", blogController.blogAjax);
  router.get("/blog/add", AdminPagesController.blogAdd);
  router.post("/blog/add", blogController.addBlog);
  router.get("/upload/images", AdminController.uploadImages);

  router.post("/tinyimages", blogController.tinyimages);

  router.post("/delete_blog/:id", blogController.blogDelete);
  router.get("/edit_blog/:id", AdminPagesController.blogEdit);
  router.post("/blog/update", blogController.updateBlog);
  router.post("/change_status/:id", blogController.changeStatus);

  router.get("/distributor", AdminPagesController.distributors);
  router.get("/distributor/view/:id", AdminPagesController.distributorDetail);
  router.post(
    "/admin/distributor/change_status",
    DistributorController.updateStatus
  );
  router.get(
    "/distributors_ajax",
    DistributorController.getDistributorListAjax
  );

  router.get("/agent", AdminPagesController.agents);
  router.get("/agent/view/:id", AdminPagesController.agentDetail);
  router.post("/admin/agent/change_status", AgentController.updateStatus);
  router.get("/agents_ajax", AgentController.getAgentListAjax);

  // REFERRAL
  router.get("/referral", AdminPagesController.referralList);
  router.get("/referral_ajax", AdminController.getReferralListAjax);
  router.get("/referral/view/:id", AdminPagesController.referralDetail);

  // MAINTENANCE
  router.get("/maintenance", AdminPagesController.maintenance);
  router.post("/admin/change_game_status", AdminController.updateGameMode);
  router.post("/admin/change_entry_fees", AdminController.updateEntryFees);
  router.post("/admin/add_banner", AdminController.updateBanner);
  router.post("/admin/save_settings", AdminController.saveSettings);
  router.post("/admin/save_maintenance", AdminController.saveMaintenance);

  // Manage Notification
  router.get("/notification", AdminPagesController.notification);
  router.post("/add_notification", AdminController.addNotification);
  router.post("/get_notification", AdminController.getOneNotification);
  router.post(
    "/notification/change_status_notification",
    AdminController.updateNotificationStatus
  );
  router.get("/notification_ajax", AdminController.getNotificationListAjax);
  router.get("/sendnotice", AdminPagesController.sendnotice);

  // PAYMENT TRANSACTIONS
  router.get("/transaction", AdminPagesController.allTransactions);
  router.get("/ajax_transaction", paymentController.getTxnAjax);

  // Game Records
  router.get("/game", AdminPagesController.gameRecords);
  router.get("/game_record_ajax", paymentController.listAllAjaxGameRecode);
  router.post("/generate_report", AdminController.generateReport);

  // DISTRIBUTOR PAYOUT MANAGEMENT
  router.get("/dist-withdrawal", AdminPagesController.distWithdrawalRequests);
  router.get("/dist_withdrawal_ajax", AdminController.distWithdrawalAjax);
  router.get("/dist-completed", AdminPagesController.distWithdrawalCompleted);
  router.get(
    "/dist_completed_ajax",
    AdminController.distWithdrawalCompletedAjax
  );
  router.get("/dist-rejected", AdminPagesController.distWithdrawalRejected);
  router.get("/dist_rejected_ajax", AdminController.distWithdrawalRejectedAjax);
  router.post("/admin/dist-withdrawal/request", (req, res) => {
    return AdminController.distWithdrawalRequestProcess(req, res, io);
  });
  router.post("/admin/dist-withdrawal/request_multiple", (req, res) => {
    return AdminController.distWithdrawalRequestProcessMultiple(req, res, io);
  });
  router.post(
    "/export_dist_withdrawal_request",
    AdminController.distExportWithdrawal
  );
  router.post(
    "/export_dist_completed_request",
    AdminController.distExportCompleted
  );

  // AGENT PAYOUT MANAGEMENT
  router.get("/agent-withdrawal", AdminPagesController.agentWithdrawalRequest);
  router.get("/agent_withdrawal_ajax", AdminController.agentWithdrawalAjax);
  router.get("/agent-completed", AdminPagesController.agentWithdrawalCompleted);
  router.get(
    "/agent_completed_ajax",
    AdminController.agentWithdrawalCompletedAjax
  );
  router.get("/agent-rejected", AdminPagesController.agentWithdrawalRejected);
  router.get(
    "/agent_rejected_ajax",
    AdminController.agentWithdrawalRejectedAjax
  );
  router.post("/admin/agent-withdrawal/request", (req, res) => {
    return AdminController.agentWithdrawalRequestProcess(req, res, io);
  });
  router.post("/admin/agent-withdrawal/request_multiple", (req, res) => {
    return AdminController.agentWithdrawalRequestProcessMultiple(req, res, io);
  });
  router.post(
    "/export_agent_withdrawal_request",
    AdminController.agentExportWithdrawal
  );
  router.post(
    "/export_agent_completed_request",
    AdminController.agentExportCompleted
  );

  // USER PAYOUT MANAGEMENT
  router.get("/withdrawal", AdminPagesController.withdrawalRequests);
  router.get("/withdrawal_ajax", AdminController.withdrawalAjax);
  router.get("/completed", AdminPagesController.withdrawalCompleted);
  router.get("/completed_ajax", AdminController.withdrawalCompletedAjax);
  router.get("/rejected", AdminPagesController.withdrawalRejected);
  router.get("/rejected_ajax", AdminController.withdrawalRejectedAjax);
  router.post("/admin/withdrawal/request", (req, res) => {
    return AdminController.withdrawalRequestProcess(req, res, io);
  });
  router.post("/admin/withdrawal/request_multiple", (req, res) => {
    return AdminController.withdrawalRequestProcessMultiple(req, res, io);
  });
  router.post("/export_withdrawal_request", AdminController.exportWithdrawal);
  router.post("/export_completed_request", AdminController.exportCompleted);

  // DISTRIBUTOR MANAGEMENT
  router.get("/distributor/add", AdminPagesController.addDistributorPage);
  router.post("/distributor/add", DistributorController.addDistributor);

  // GENERIC
  router.get("/admin/404", AdminPagesController.pageNotFound);
  router.get("/admin/401", AdminPagesController.Unauthorized);

  router.get("/admin/find_user", UserController.findUser);
  router.get("/admin/find_userByRole", UserController.findUserByRole);
  router.get("/admin/find_distributor", DistributorController.findDistributor);
  router.get("/admin/find_agent", AgentController.findAgent);
// Generate Chip
router.get("/history-generate-chip", AdminPagesController.generateHistory);
router.get("/generate-chip", AdminPagesController.generateChip);
router.post("/updateGeneratePoint",AdminController.updateGeneratePoint) 

  // NOTICE
  router.get("/notice-management", AdminPagesController.noticeManagement);
  router.get("/notice", AdminPagesController.notice);
  router.get("/noticelist", AdminPagesController.getnoticelist)
  router.post("/addnoticelist",AdminController.addnoticelist) 
  router.post("/admin/addNotice", AdminController.saveNoticeData);
  router.post("/admin/editNotice", AdminController.editNoticeData);
// Change Pin And Pass 
router.get("/chang-pass", AdminPagesController.changePass);
router.get("/chang-pin", AdminPagesController.changePin);


  // commsion
  router.get("/transferPoint", AdminPagesController.transferPoint);
  router.post("/admin/saveTransferPoint", AdminController.saveTransferPoint);
  router.get("/depositRequest", AdminPagesController.depositRequest);
  router.get("/transferPointToUpper", AdminPagesController.transferPointToUpper);
  router.get("/transferReport", AdminPagesController.transferReport);
  router.get("/ajax_transferPoint", paymentController.getTransferAjax);

  // chip curculation 
  router.get("/chipcurculation", AdminPagesController.chipcurlation);
  router.get("/ajax_chipcurculation", paymentController.chipcurculation);

  // ADDING
  router.get("/Distributer", AdminPagesController.Distributer);
  router.get("/PlayerManagementSystem", AdminPagesController.PlayerManagementSystem);
  router.get("/ManualResultForCarRoulete", AdminPagesController.ManualResultCarRoulete);
  router.get("/GameStatestics", AdminPagesController.GameStatestics);
  router.get("/RevenueMaster", AdminPagesController.RevenueMaster);
  router.get("/ProfitPercentMaster", AdminPagesController.ProfitPercentMaster);
  router.get("/DistributerSecurityPinMgt", AdminPagesController.DistributerSecurityPinMgt);
  router.get("/Setting", AdminPagesController.Setting);
  router.get("/BusinessReport", AdminPagesController.BusinessReport);

  //Add Ranks
  router.get("/revenue-report", AdminPagesController.revenueReport);
  router.get("/commission", AdminPagesController.Commission);
  router.get("/rankMaster", AdminPagesController.rankMaster);
  router.get("/create-user", AdminPagesController.createUser);
  router.get("/addRankCompany", AdminPagesController.addRankss);
  router.get("/admin/getSearchIds", AdminController.searchId);
  router.get("/admin/getIndianStates", AdminController.getIndianStates);
  router.get("/admin/getIndianDistrict", AdminController.getIndianDistrict);
  router.get("/admin/selectedId", AdminController.selectedId);
  router.get("/admin/getChildIds", AdminController.childIds);
  router.get("/admin/getParentName", AdminController.getParentName)
  router.get("/distributerMaster", AdminPagesController.distributerMaster);
  router.post("/admin/editUserSave", AdminController.editUserSave);
  router.post("/admin/edit-user-update", AdminController.editUserUpdate);
  router.post("/admin/saveAddRank", AdminController.saveAddRankData);
  router.post("/admin/saveAddRankDataByParent", AdminController.saveAddRankDataByParent);
  router.post("/admin/saveModifyPlayerData", AdminController.saveModifyPlayerData);
  router.post("/admin/modifyPlayerSave", AdminController.modifyPlayerSave);
  router.post("/admin/create-distributor", AdminController.saveCreateAdminData);
  router.post("/admin/edit-distributor", AdminController.saveEditAdminData);
  router.post("/admin/create-rank", AdminController.saveCreateRankData);
  router.post("/admin/update-rank-data", AdminController.updateRankData);
  router.get("/user/delete-rank", AdminController.deleteRank);
  router.get("/user/active-notice", AdminController.activeNotice);
  router.get("/user/delete-user", AdminController.deleteUser);
  router.get("/user/accept-request", AdminController.acceptRequest);
  router.get("/user/delete-distributor", AdminController.deleteDistributor);
  router.get("/commission-mgt", AdminPagesController.commissionMgt);
  router.get("/game-mgt", AdminPagesController.gameMgt);
  router.get("/profit-management", AdminPagesController.commissionLimit);
  router.post("/admin/saveCommission-mgt", AdminController.saveCommissionMgt);
  router.post("/admin/save-profit-percent", AdminController.saveCommissionLimit);
  router.post("/admin/upadte-game-setting", AdminController.updateGameSetting);

  // Banners management
  router.get("/banners", AdminPagesController.bannerList);
  router.get("/banners_ajax",AdminController.getBannerListAjax);
  router.get("/banners/add", AdminPagesController.addBannerPage);
  router.post("/banners/add",AdminController.addBanner);
  router.post("/admin/banners/change_status",AdminController.bannerUpdateStatus);
  router.post("/admin/banners/delete",AdminController.bannerDelete);

  //Commission Report
  router.get("/manual-card-roullete", AdminPagesController.manualCardRoullete);
  router.get("/car-roullete-report", AdminPagesController.carRoulleteReport);
  router.get("/roullete-report", AdminPagesController.roulleteReport);
  router.get("/avaitor-report", AdminPagesController.avaitorReport);

  //Bet History
  router.get("/bet-avaitor", AdminPagesController.betHistoryAvaitor);
  router.get("/bet-roullete", AdminPagesController.betHistoryRoullete);
  router.get("/bet-card-roullete", AdminPagesController.betHistoryCardRoullete);
  router.get("/betHistory_ajax_transaction", paymentController.getBetHistoryTxnAjax);
// Bet Statics
router.get("/roullete-statics", AdminPagesController.roulleteStatics);
router.get("/card-roullete-statics", AdminPagesController.liveStaticsCardRoullete);
router.get("/avaitor-statics", AdminPagesController.liveStaticsAvaitor);
router.get("/get_id", paymentController.userName);

//Commission Report
router.get("/commission-report", AdminPagesController.allCommissionReport);
router.get("/commission_ajax_transaction", paymentController.getCommissionAjax);


};
