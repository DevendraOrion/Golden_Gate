const Distributor = require('../models/distributor'),
      Agent = require('../models/agent'),
      Commission = require('../models/commission'),
      { AccessLog } = require('./../models/accessLog'),
      { User } = require('./../models/user'),      
      Service = require('./../service'),
      config = require('./../../config'),
      logger = require('./../service/logger'),
      localization = require('./../service/localization'),
      utility = require('./utilityController'),
    //   nodemailer = require("nodemailer"),
      Mailer = require('./../service/email')
      moment = require('moment-timezone'),
      bcrypt = require('bcryptjs'),
      _ = require('lodash'),
      ObjectId = require('mongoose').Types.ObjectId,
      fs = require('fs');

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
  addRankData: async (user) => {
    const roles = {
        1: "Company",
        2: "State",
        3: "District",
        4: "Zone",
        5: "Agent",
        6: "User",
      };
      console.log(user);
      const data =user.role;
      
      const currentRoleKey = Object.keys(roles).find((key) => roles[key] === data);
      const rolesBelow = Object.keys(roles).filter((key) => {
        return parseInt(key) > parseInt(currentRoleKey);
      }).map((key) => roles[key]);
      
      const commission=await Commission.findOne({type:rolesBelow[0]})
      return {role:rolesBelow,commission,parentData:user}
      
  },
  addRankssData: async (req,role) => {
//   console.log(role);  
    req=req.admin
    let user =req
    const roles = {
        1: "Company",
        2: "State",
        3: "District",
        4: "Zone",
        5: "Agent",
        6: "User",
      };
      
      const data =user.role;
      const currentRoleKey = Object.keys(roles).find((key) => roles[key] === role);
      
      const rolesBelow = Object.keys(roles).filter((key) => {
        return parseInt(key) > parseInt(currentRoleKey);
      }).map((key) => roles[key]);

      const rolesAbove = Object.keys(roles).filter((key) => {
        return parseInt(key) < parseInt(currentRoleKey);
      }).map((key) => roles[key]);

        const lastElement = rolesAbove[rolesAbove.length - 1];
        console.log(lastElement);
        
        let allParentData=await User.find({role:lastElement},{numeric_id:1,_id:0 , search_id:1})
      const commission=await Commission.findOne({type:rolesBelow[0]})
      return {role:rolesBelow,commission,parentData:user,roles:role,parentData:allParentData}
      
  },
  commission_management: async (req, limit) => {
let Company=await Commission.find({type:"Company"})
let State=await Commission.find({type:"State"})
let District=await Commission.find({type:"District"})
let Zone=await Commission.find({type:"Zone"})
let Agent=await Commission.find({type:"Agent"})
let User=await Commission.find({type:"User"})
// console.log(Company[0],State[0],District[0],Zone[0],Agent[0],User[0]);

return {Company,State,District,Zone,Agent,User}
      
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

  updateStatus: async function(req, res) {
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

    if (rez){
        var newLog = new AccessLog({
            admin: req.admin._id,
            action: `${params.status == 'true' ? 'Activated':'Deacivated'} distributor's account`,
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
                $match:obj
            },{
                $sort:sortObj
            },{
                $skip:parseInt(params.start)
            },{
                $limit:params.length == -1 ? '' : parseInt(params.length)
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
                    `<small class="label bg-${u.is_active ? 'green' : 'red'}">${
                        u.is_active ? 'Active' : 'Inactive'
                    }</small>`,
                    `<a target="_blank" href="${config.pre + req.headers.host}/distributor/view/${
                        u._id
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
            is_deleted:false
        };
        if (params.search) {
            if (params.search.trim() != '') {
                condition['name'] = {
                    $regex: '^'+params.search,
                    $options: 'i'
                };
            }
        }
        aggregate_obj.push({
            $match:condition
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