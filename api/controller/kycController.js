var { User } = require("../models/user"),
  Table = require("../models/table"),
  { Transaction } = require("../models/transaction"),
  { AccessLog } = require("../models/accessLog"),
  { KycRequest } = require("../models/kycrequest"),
  { Default } = require("../models/default");
var config = require("../../config"),
  _ = require("lodash"),
  Service = require("../service"),
  Mailer = require("../service/email"),
  Sms = require("../service/sms"),
  localization = require("../service/localization");
var bcrypt = require("bcryptjs");
var request = require("request");
var Cryptr = require("cryptr");
var cryptr = new Cryptr(config.cryptrSecret);
var logger = require("../service/logger");
var utility = require("./utilityController");
// var ObjectId = require('mongoose').Types.ObjectId;

var timeago = require("timeago.js");
var randomString = require("random-string");
// var timeagoInstance = timeago();

module.exports = {
  kycRequest: async () => {
    const wr = await KycRequest.find({
      kyc_verified: {},
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
          username: w.user_id.username,
          user_id: w.user_id._id,
          created: moment(Date.parse(w.created_date)).format(
            "YYYY-MM-DD HH:mm:ss A"
          ), //await Service.formateDate(parseInt(w.created_at)),
          updated: moment(Date.parse(w.updated_date)).format(
            "YYYY-MM-DD HH:mm:ss A"
          ), //await Service.formateDate(parseInt(w.created_at)),
          document_type: _.capitalize(w.document.docType),
          document_number: w.document.number,
          frontImage: config.api_root+w.document.front,
          rearImage: config.api_root+w.document.rear,
          selfImage: config.api_root+w.self_image,
          status: w.status,
          name: w.name,
        api_root:config.api_root

        };
      })
    );
    let total = await KycRequest.find({}).countDocuments();

    return {
      list,
      total,
    };
  },

  kycAjax: async (req, res) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {};
    const user_id = params.id || "";
    if (Service.validateObjectId(user_id)) {
      matchObj.user_id = ObjectId(user_id);
    }
    if (params.filter) {
      matchObj.document.doc_type = params.filter;
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
        username: "$users.username",
        user_id: "$users._id",
        document_type: "$document.docType",
        document_number: "$document.number",
        status: "$status",
        created: "$created_date", //await Service.formateDate(parseInt(w.created_at)),
        updated: "$updated_date", //await Service.formateDate(parseInt(w.created_at)),
        created_at: "$created_at",
        name: "$name",
        frontImage: "$document.front",
        rearImage: "$document.rear",
        selfImage: "$self_image",
        api_root:config.api_root
      },
    });
    logger.info("AGGRE ", JSON.stringify(aggregation_obj, undefined, 2));
    let list = await KycRequest.aggregate(aggregation_obj).allowDiskUse(true);
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
    let rF = await KycRequest.aggregate(aggregate_rf).allowDiskUse(true);
    logger.info("RF ", rF);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await KycRequest.find({}).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        if (u.status == "verified") {
          var classname = "btn-warning";
        } else {
          var classname = "btn-warning";
        }
        //logger.info("User Transaction",u);
        
        return [
          u.id,
          rank++,
          `<a target="_blank" href="/user/view/${u.user_id}">${u.username}</a>`,
          _.capitalize(u.name),
          _.capitalize(u.document_type),
          moment(Date.parse(u.created)).format("YYYY-MM-DD HH:mm:ss A"),
          moment(Date.parse(u.updated)).format("YYYY-MM-DD HH:mm:ss A"),
          `<ul class="list-inline">
		  <li>
		  <a href="#"><small class="label bg-blue"
		  onclick="showData('${u.name}','${_.capitalize(u.document_type)}', '${
            u.frontImage
          }', '${u.rearImage}', '${u.selfImage}', '${
            u.document_number
          }', '${moment(Date.parse(u.created)).format(
            "YYYY-MM-DD HH:mm:ss A"
          )}','${u.api_root}')">View</small></a>
</li>

      ${
        (u.status == "pending")
          ? "<li><a href='#'><small class='label bg-green' onclick='acceptRequest("+`"${String(u.id)}"`+",\"A\",\"\")'>Accept</small></a></li><li><a href='#' onclick='rejectModal("+`"${String(u.id)}"`+",\"R\")'><small class='label bg-red'>Reject</small></a></li>"
          : "<li><a href='javascript:void(0);'><small class='label " +
            classname +
            "'>" +
            _.capitalize(u.status) +
            "</small></a></li>"
      }
      
			
		</ul>`,
        ];
      })
    );
    return res.status(200).send({
      data: await list,
      draw: new Date().getTime(),
      total: recordsTotal,
      recordsFiltered: recordsFiltered,
    });
  },

  kycRequestProcess: async (req, res, io) => {
    var params = _.pick(req.body, "request_id", "status", "reason");
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
    var status =
      params.status == "A"
        ? "verified"
        : params.status == "R"
        ? "rejected"
        : "";
    if (checkId) {
      var acceptRequest = await KycRequest.findByIdAndUpdate(
        params.request_id,
        {
          $set: {
            status: status,
            reason: params.reason,
            updated_date: new Date().getTime(),
          },
        }
      );

      if (acceptRequest) {
        var acceptRequest = await KycRequest.findOne({
          _id: params.request_id,
        });
        var userId = await User.updateOne(
          { _id: acceptRequest.user_id },
          {
            kyc_verified: {
              status: status,
              reason: params.reason,
            },
          }
        )
          .then((d) => {
            //logger.info("Refund Amount Completed");
            let message = {
              app_id: config.ONESIGNAL_APP_ID,
              contents: {
                en: localization.kycPushReject,
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
                amount: acceptRequest.amount,
              };
              if (d.email_verified) Mailer.sendWithdrawlRejected(emailObjR);
              else
                console.log(
                  "CAN't send email cause unverified, sendKycRejected"
                );
            }
          })
          .catch((e) => {
            logger.info("Error While update status ", e);
          });

        return res.send({
          status: 1,
          Msg: localization.KycRequestProcessed,
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

  /* User Payout Export */
  exportWithdrawal: async (req, res) => {
    logger.info("export_kyc_request STARTED", req.body);
    try {
      let aadhar_match = {
        status: "P",
        document: { docType: "Aadhar" },
      };
      let pan_match = {
        status: "P",
        document: { docType: "Pan" },
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
        aadhar_match._id = {
          $in: final_ids,
        };
        pan_match._id = {
          $in: final_ids,
        };
      }
      logger.info("DATA", aadhar_match, pan_match);
      let aadhar_data = await WithdrawalRequest.aggregate([
        {
          $match: aadhar_match,
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
            Username: "$user.username",

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

  kycCompletedRequest: async () => {
    const wr = await kycRequest
      .find({
        status: "verified",
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
          username: w.user_id.username,
          user_id: w.user_id._id,
          created: moment(Date.parse(w.created_date)).format(
            "YYYY-MM-DD HH:mm:ss A"
          ), //await Service.formateDate(parseInt(w.created_at)),
          updated: moment(Date.parse(w.updated_date)).format(
            "YYYY-MM-DD HH:mm:ss A"
          ), //await Service.formateDate(parseInt(w.created_at)),
          document_type: _.capitalize(w.document.docType),
          document_number: w.document.number,
          frontImage: w.document.front,
          rearImage: w.document.rear,
          selfImage: w.self_image,
          status: w.status,
          name: w.name,
        };
      })
    );
    //logger.info('Withdrawal List :: ', list);
    let total = await this.kycRequest
      .find({
        status: "verified",
      })
      .countDocuments();
    return {
      list,
      total,
    };
  },
  kycCompletedAjax: async (req, res) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    console.log("COMPLETED AJAX PARAMS", params);
    let status = "";
    let matchObj = {
      status: "A",
    };
    const user_id = params.id || "";
    if (Service.validateObjectId(user_id)) {
      matchObj.user_id = ObjectId(user_id);
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
        username: "$users.username",
        user_id: "$users._id",
        document_type: "$document.docType",
        document_number: "$document.number",
        status: "$status",
        created: "$created_date", //await Service.formateDate(parseInt(w.created_at)),
        updated: "$updated_date", //await Service.formateDate(parseInt(w.created_at)),
        created_at: "$created_at",
        name: "$name",
        frontImage: "$document.front",
        rearImage: "$document.rear",
        selfImage: "$self_image",
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
          `<a target="_blank" href="/user/view/${u.user_id}">${u.username}</a>`,
          u.amount,
          _.capitalize(u.document_type),
          `<span class='time_formateDateandTime2'>${moment(
            Date.parse(u.created)
          ).format("YYYY-MM-DD HH:mm:ss A")}')</span>`,
          `<span class='time_formateDateandTime2'>${moment(
            Date.parse(u.updated)
          ).format("YYYY-MM-DD HH:mm:ss A")}')</span>`,
          `<ul class="list-inline">
		  <li>
		  <a href="#"><small class="label bg-blue"
		  onclick="showData('${u.name}','${_.capitalize(u.document_type)}', '${
            u.frontImage
          }>', '${u.rearImage}', '${u.selfImage}', '${
            u.document_number
          }', '${moment(Date.parse(u.created)).format(
            "YYYY-MM-DD HH:mm:ss A"
          )}')">View</small></a>
</li>
		  <li>
			<a href="#"><small class="label bg-green" onclick="acceptRequest('${
        u.id
      }', 'A','')">Accept</small></a>
		  </li>
      
		  <li>
      <a href="#" onclick="rejectModal('${u.id}','R')"><small
                                                                class="label bg-red">Reject</small></a>
			
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
};
