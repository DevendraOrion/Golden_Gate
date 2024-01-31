const Distributor = require('../models/distributor'),
  Agent = require('../models/agent'),
  Commission = require('../models/commission'),
  { AccessLog } = require('./../models/accessLog'),
  { User } = require('./../models/user'),
  { Rank_Data } = require("./../models/rankData"),
  Service = require('./../service'),
  config = require('./../../config'),
  logger = require('./../service/logger'),
  noticeData = require("./../models/notice-data"),
  localization = require('./../service/localization'),
  utility = require('./utilityController'),
  //   nodemailer = require("nodemailer"),
  Mailer = require('./../service/email')
moment = require('moment-timezone'),
  bcrypt = require('bcryptjs'),
  _ = require('lodash'),
  ObjectId = require('mongoose').Types.ObjectId,
  fs = require('fs');
  var IndiaState = require("./../../IndiaState.json");

module.exports = {
  getDistributorsList: async (req, limit) => {
    const list = await Distributor.find({
      is_deleted: false,
      admin_id: req.admin._id
    })
      .sort({
        created_at: -1
      })
      .limit(limit);

    let count = await Distributor.find({
      is_deleted: false,
      admin_id: req.admin._id
    }).countDocuments();

    return {
      list,
      count
    }
  },
  modifyPlayerData: async (user) => {

    const rolesData = await Rank_Data.find({}, { rankName: 1, rankId: 1, _id: 0 });
    const roles = {};

    rolesData.forEach(role => {
      roles[parseInt(role.rankId, 10)] = role.rankName;
    });

    const maxIndex = Math.max(...Object.keys(roles).map(Number));
    roles[1] = "Company";
    roles[maxIndex + 1] = "User";
    const data = user.role;
    const parent = await User.findOne({ _id: user.parent })
    console.log(user);
    const currentRoleKey = Object.keys(roles).find((key) => roles[key] === data);
    const rolesBelow = Object.keys(roles).filter((key) => {
      return parseInt(key) > parseInt(currentRoleKey);
    }).map((key) => roles[key]);

    //   const commission=await Commission.findOne({type:rolesBelow[0]})
    return { role: rolesBelow, user: user, roles: rolesBelow[0], parent: parent }

  },
  addRankData: async (user) => {

    const rolesData = await Rank_Data.find({}, { rankName: 1, rankId: 1, _id: 0 });
    const roles = {};

    rolesData.forEach(role => {
      roles[parseInt(role.rankId, 10)] = role.rankName;
    });

    const maxIndex = Math.max(...Object.keys(roles).map(Number));
    roles[1] = "Company";
    roles[maxIndex + 1] = "User";
    // console.log(user);
    const data = user.role;

    const currentRoleKey = Object.keys(roles).find((key) => roles[key] === data);
    const rolesBelow = Object.keys(roles).filter((key) => {
      return parseInt(key) > parseInt(currentRoleKey);
    }).map((key) => roles[key]);

    const commission = await Commission.findOne({ type: rolesBelow[0] })
    return { role: rolesBelow, commission, parentData: user, roles: rolesBelow[0] }

  },
  modifyUserData: async (req, role) => {
    //   console.log(role);  
    req = req.admin
    let user = req
    // const roles = {
    //     1: "Company",
    //     2: "State",
    //     3: "District",
    //     4: "Zone",
    //     5: "Agent",
    //     6: "User",
    //   };
    // const rolesData = await Rank_Data.find({}, { rankName: 1, rankId: 1, _id: 0 });
    // const roles = {};

    // rolesData.forEach(role => {
    //     roles[parseInt(role.rankId, 10)] = role.rankName;
    // });

    // roles[1] = "Company";
    // roles[6] = "User";
    const rolesData = await Rank_Data.find({}, { rankName: 1, rankId: 1, _id: 0 });
    const roles = {};

    rolesData.forEach(role => {
      roles[parseInt(role.rankId, 10)] = role.rankName;
    });

    const maxIndex = Math.max(...Object.keys(roles).map(Number));
    roles[1] = "Company";
    roles[maxIndex + 1] = "User";
    const data = user.role;
    const currentRoleKey = Object.keys(roles).find((key) => roles[key] === role);

    const rolesBelow = Object.keys(roles).filter((key) => {
      return parseInt(key) > parseInt(currentRoleKey);
    }).map((key) => roles[key]);

    const rolesAbove = Object.keys(roles).filter((key) => {
      return parseInt(key) < parseInt(currentRoleKey);
    }).map((key) => roles[key]);

    const lastElement = rolesAbove[rolesAbove.length - 1];
    console.log(lastElement);

    let allParentData = await User.find({ role: lastElement }, { numeric_id: 1, _id: 0, search_id: 1 })
    const commission = await Commission.findOne({ type: rolesBelow[0] })
    return { role: rolesBelow, commission, parentData: user, roles: role, parentData: allParentData }

  },
  editUserData: async (req,id) => {
    console.log("===================");
  let edit=id
  let noticeDatas=await noticeData.findOne({noticeId:id})

  return {noticeDatas}

  },
  addRankUserData: async (req,role,id) => {
    console.log("===================");
    let previousData

    let previousParentData
    let user = req.admin
    let editData=null
    if(id){
      previousData=await User.findById(id)
      previousParentData=await User.findById(previousData.parent)
      editData=previousData
// console.log(previousData);
    }

    
    let allState=Object.keys(IndiaState);


    let allParentData = await User.find({ role: "Agent" }, { _id: 0, search_id: 1, role: 1 })

    return { role: role, parentData: user, parentDataSearchId: allParentData,editData:previousData,previousParentData ,allState:allState}

  },
  addRankssData: async (req) => {
    console.log("===================");

    let user = req.admin

    const rolesData = await Rank_Data.find({}, { rankName: 1, rankId: 1, _id: 0 });
    const roles = {};

    rolesData.forEach(role => {
      roles[parseInt(role.rankId, 10)] = role.rankName;
    });

    const maxIndex = Math.max(...Object.keys(roles).map(Number));
    roles[1] = "Company";
    // roles[maxIndex + 1] = "User";

    // console.log(roles);

    const data = user.role;

    const currentRoleKey = Object.keys(roles).find((key) => roles[key] === data);

    const rolesAbove = Object.keys(roles).filter((key) => {
      return parseInt(key) < parseInt(currentRoleKey);
    }).map((key) => roles[key]);

    const rolesBelow = Object.keys(roles).filter((key) => {
      return parseInt(key) > parseInt(currentRoleKey);
    }).map((key) => roles[key]);
    rolesBelow.unshift("Company")
    const lastElement = rolesAbove[rolesAbove.length - 1];
   
    let allParentData = await User.find({ role: lastElement }, { _id: 0, search_id: 1, role: 1 })

    const commission = await Commission.findOne({ type: rolesBelow[0] })

    let allState=Object.keys(IndiaState);

    return { role: rolesBelow, commission, parentData: user, parentDataSearchId: allParentData,allState }

  },
  showRankData: async (req) => {

    let user = req.admin
    let data = await Rank_Data.find({})
    // console.log(data);
    return ({ rankData: data, user })
  },

  editDistributerData: async (req, rank_id, updated) => {
    // console.log(req,rank_id,updated);
    let data
    if (rank_id) {
      data = await Distributor.findOne({ search_id: rank_id })
    }
    console.log(rank_id);
    let parentData = await User.findOne({ _id: data.parent })
    let user = req.admin

    return ({ data, user, updated, parentData })
  },
  editRankData: async (req, rank_id, updated) => {
    // console.log(req,rank_id,updated);
    let data
    if (rank_id) {
      data = await Rank_Data.findOne({ rankId: rank_id })
    }
    // console.log(data);
    let parentData = await User.findOne({ _id: data.parent })
    let user = req.admin

    return ({ data, user })
  },

  commission_management: async (req, limit) => {
    // const RankData=await Rank_Data.find({}).sort({rankId:1})
    const RoulleteData=await Rank_Data.aggregate([
      {
        $lookup: {
          from: "commissions",
          localField: "rankId",
          foreignField: "rankId",
          as: "commissionData",
        },
      },
      {
        $unwind: "$commissionData"
      },
      {
        $match:{
          "commissionData.gameType":"Roulette"
        }
      },
      {
        $sort:{rankId:1}
      }
    ])
    const CardRoulleteData=await Rank_Data.aggregate([
      {
        $lookup: {
          from: "commissions",
          localField: "rankId",
          foreignField: "rankId",
          as: "commissionData",
        },
      },
      {
        $unwind: "$commissionData"
      },
      {
        $match:{
          "commissionData.gameType":"CardRoulette"
        }
      },
      {
        $sort:{rankId:1}
      }
    ])
    const AvaitorData=await Rank_Data.aggregate([
      {
        $lookup: {
          from: "commissions",
          localField: "rankId",
          foreignField: "rankId",
          as: "commissionData",
        },
      },
      {
        $unwind: "$commissionData"
      },
      {
        $match:{
          "commissionData.gameType":"Aviator"
        }
      },
      {
        $sort:{rankId:1}
      }
    ])

    console.log(RoulleteData.length,AvaitorData.length,CardRoulleteData.length);
    return { RoulleteData,AvaitorData,CardRoulleteData }

  },

  getDistributorsDetails: async (req, res) => {
    let is_validate = await Service.validateObjectId(req.params.id);

    if (!is_validate) {
      res.redirect('/admin/404');
    } else {
      let resp = await Distributor.findById(req.params.id, (err, distributor) => {
        return err ? err : distributor
      });
      return resp;
    }
  },

  getAllDistributorCount: async (req) => {
    let count = await Distributor.find({
      is_deleted: false,
      admin_id: req.admin._id
    }).countDocuments();

    return count;
  },

  totalAgents: async (req) => {
    let resp = await Agent.countDocuments({
      is_active: true,
      is_deleted: false,
      distributor_id: req.params.id
    });
    return resp;
  },

  updateStatus: async function (req, res) {
    var startTime = new Date();

    var params = _.pick(req.body, ['id', 'status']);
    //logger.info("PARAMS", params);
    if (!params) return res.send(Service.response(0, localization.missingParamError, null));

    if (!Service.validateObjectId(params.id)) {
      return res.send(Service.response(0, localization.missingParamError, null));
    }

    var rez = await Distributor.findByIdAndUpdate(params.id, {
      $set: {
        is_active: params.status == 'true'
      }
    });

    var endTime = new Date();
    utility.logElapsedTime(req, startTime, endTime, 'updateStatus');

    if (rez) {
      var newLog = new AccessLog({
        admin: req.admin._id,
        action: `${params.status == 'true' ? 'Activated' : 'Deacivated'} distributor's account`,
        distributor: params.id,
        created_at: new Date().getTime()
      });
      await newLog.save();

      return res.send(Service.response(1, localization.success, null));
    }
    else return res.send(Service.response(0, localization.serverError, null));
  },

  getDistributorListAjax: async (req, res, next) => {
    let startTime = new Date();
    try {
      const params = req.query;

      let obj = {
        is_deleted: false,
        admin_id: req.admin._id
      };
      if (params.search) {
        if (params.search.value.trim() != '') {
          obj['$or'] = [
            {
              name: {
                $regex: params.search.value,
                $options: 'i'
              }
            },
            {
              'mobile_no.number': {
                $regex: params.search.value,
                $options: 'i'
              }
            }
          ];
        }
      }

      let sortObj = {};
      if (params.order) {
        if (params.order[0]) {
          if (params.order[0].column == '0') {
            // SORT BY NAME
            sortObj.name = params.order[0].dir == 'asc' ? 1 : -1;
          } else if (params.order[0].column == '2') {
            // SORT BY EMAIL
            sortObj.email = params.order[0].dir == 'asc' ? 1 : -1;
          } else if (params.order[0].column == '3') {
            // SORT BY WALLET
            sortObj.commission_wallet = params.order[0].dir == 'asc' ? 1 : -1;
          } else if (params.order[0].column == '5') {
            // SORT BY REG DATE
            sortObj.created_at = params.order[0].dir == 'asc' ? 1 : -1;
          } else {
            sortObj = { created_at: -1 };
          }
        } else {
          sortObj = { created_at: -1 };
        }
      } else {
        sortObj = { created_at: -1 };
      }

      let list = await Distributor.aggregate([
        {
          $match: obj
        }, {
          $sort: sortObj
        }, {
          $skip: parseInt(params.start)
        }, {
          $limit: params.length == -1 ? '' : parseInt(params.length)
        }
      ]).allowDiskUse(true);

      list = await Promise.all(
        list.map(async u => {
          return [
            u.name,
            u.email,
            `${u.mobile_no.country_code}&nbsp;${u.mobile_no.number}`,
            u.commission_wallet || 0,
            u.created_at,
            `<small class="label bg-${u.is_active ? 'green' : 'red'}">${u.is_active ? 'Active' : 'Inactive'
            }</small>`,
            `<a target="_blank" href="${config.pre + req.headers.host}/distributor/view/${u._id
            }" class="on-editing save-row"><i class="fa fa-eye"></i></a>`
          ];
        })
      );

      let total = await Distributor.find({
        is_deleted: false
      }).countDocuments();
      let total_f = await Distributor.find(obj).countDocuments();

      let endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, 'getDistributorListAjax');

      return res.status(200).send({
        data: list,
        draw: new Date().getTime(),
        recordsTotal: total,
        recordsFiltered: total_f
      });
    } catch (err) {
      let endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, 'getDistributorListAjax');

      return res.send(Service.response(0, localization.ServerError, err.message));
    }
  },

  addDistributor: async (req, res, next) => {
    let params = _.pick(req.body, 'name', 'email', 'mobileCountryCode', 'mobileNumber', 'isActive');

    if (_.isEmpty(params)) {
      return res.status(200).json(Service.response(0, localization.missingParamError, null));
    }

    if (
      _.isEmpty(params.name) ||
      _.isEmpty(params.email) ||
      _.isEmpty(params.mobileCountryCode) ||
      _.isEmpty(params.mobileNumber) ||
      _.isEmpty(params.isActive)) {

      return res.send({
        status: 0,
        message: localization.missingParamError
      });
    }

    if (!Service.validateEmail(params.email))
      return res.status(200).json(Service.response(0, localization.emailValidationError, null));

    if (isNaN(params.mobileNumber) || params.mobileNumber.trim().length != 10)
      return res.status(200).json(Service.response(0, localization.mobileValidationError, null));

    var us = await Distributor.findOne({
      email: params.email.trim()
    });

    if (us) return res.status(200).json(Service.response(0, localization.emailExistError, null));

    us = await Distributor.findOne({
      'mobile_no.number': params.mobileNumber
    });

    if (us) return res.status(200).json(Service.response(0, localization.mobileExistError, null));

    if (req.files) {
      if (req.files.profilePicture) {
        params.profilePicture = await Service.uploadFile(req.files.profilePicture, ['jpeg', 'jpg', 'png']);
      }
    }

    let pass = "123456";
    let hash = bcrypt.hashSync(pass);

    let obj = {
      "admin_id": req.admin._id,
      "name": params.name,
      "email": params.email,
      "password": hash,
      "profile_picture": params.profilePicture || config.pre + req.headers.host + '/admin-assets/dist/img/avatar5.png',
      "mobile_no": {
        "country_code": params.mobileCountryCode,
        "number": params.mobileNumber
      },
      "role": 'Company',
      "commission_wallet": 0,
      "is_active": params.isActive,
      "created_at": new Date().getTime()
    }

    let resp = new Distributor(obj);
    await resp.save();

    if (!resp) return res.status(200).json(Service.response(0, localization.serverError, null));

    /* let htmlTemplate = fs.readFileSync('./public/signup email template.txt', 'utf8');
    htmlTemplate = htmlTemplate.replace(/_replace_name_value_/g, resp.name);
    htmlTemplate = htmlTemplate.replace(/_replace_email_value_/g, resp.email);
    htmlTemplate = htmlTemplate.replace(/_replace_mobile_value_/g, resp.mobile_no.country_code + ' ' + resp.mobile_no.number);
    htmlTemplate = htmlTemplate.replace(/_replace_role_value_/g, 'Distributor');
    htmlTemplate = htmlTemplate.replace(/_replace_redirect_url_value_/g, config.pre + req.headers.host + '/distributor/forgot-password'); */

    /* let transporter = nodemailer.createTransport(config.SMTPConfig);
    let info = await transporter.sendMail({
      from: '"Scott Walker 👻" <scottwalker.cis@gmail.com>',
      to: params.email,
      subject: "Congratulation you are now PocketLudo Distributor",
      text: "",
      html: htmlTemplate,
    }, (err, info) => {
      if (err) {
        return res.status(200).json(Service.response(0, localization.userAddMailSendFailure, err));
      } else {
        return info;
      }
    }); */

    let data = {
      name: resp.name,
      email: resp.email,
      password: pass,
      mobile_no: resp.mobile_no.country_code + ' ' + resp.mobile_no.number,
      role: 'Distributor',
      host: req.headers.host
    }

    let sendMailRes = await Mailer.sendDistributorAddEmail(data);
    if (sendMailRes) {
      return res.status(200).json(Service.response(1, localization.success, resp));
    } else {
      return res.status(200).json(Service.response(0, localization.distAddMailSendFailure, err));
    }
  },

  findDistributor: async (req, res) => {
    var startTime = new Date();

    try {
      const params = _.pick(req.query, ['search']);

      let aggregate_obj = [];
      let condition = {
        is_deleted: false
      };
      if (params.search) {
        if (params.search.trim() != '') {
          condition['name'] = {
            $regex: '^' + params.search,
            $options: 'i'
          };
        }
      }
      aggregate_obj.push({
        $match: condition
      });

      aggregate_obj.push(
        {
          $sort: {
            name: 1
          }
        },
        {
          $limit: 30
        },
        {
          $project: {
            id: '$_id',
            text: '$name'
          }
        },
        {
          $project: {
            _id: 0
          }
        }
      );

      let distributors = await Distributor.aggregate(aggregate_obj).allowDiskUse(true);

      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, 'findDistributor');

      return res.send({ results: distributors });
    } catch (err) {
      logger.info('ERR', err);
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, 'findDistributor');

      return res.send({ results: [] });
    }
  }
}