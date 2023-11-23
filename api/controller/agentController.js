const config = require('../../config'),
      Agent = require('../models/agent'),
      { User } = require('../models/user'),
      utility = require('./utilityController'),
      { AccessLog } = require('./../models/accessLog'),
      Service = require('./../service'),
      localization = require('./../service/localization');

module.exports = {
    getAgentsList: async (req, limit) => {
      let list = await Agent.find({
        is_deleted: false
      })
      .sort({
        created_at: -1
      })
      .limit(limit);
      
      let count = await Agent.find({
        is_deleted: false
      }).countDocuments();

      return {
        list,
        count
      }
    },

    getAgentDetails: async (req) => {
      let is_validate = await Service.validateObjectId(req.params.id);
      
      if (!is_validate) {
        res.redirect('/admin/404');
      } else {
        let resp = await Agent.findById(req.params.id, (err, agent) => {
          return err ? err : agent
        });
        return resp;
      }
    },

    findAgent: async (req, res, next) => {
      let startTime = new Date();
  
      try {
        const params = _.pick(req.query, ['search']);
  
        let aggregate_obj = [];
        let condition = {
          is_active: true,
          is_deleted: false
        };
        if (params.search) {
          if (params.search.trim() != '') {
            condition['username'] = {
              $regex: '^' + params.search,
              $options: 'i'
            };
          }
        }
        aggregate_obj.push({
          $match: condition
        });
  
        aggregate_obj.push({
          $sort: {
            username: 1
          }
        }, {
          $limit: 30
        }, {
          $project: {
            id: '$_id',
            text: '$username'
          }
        }, {
          $project: {
            _id: 0
          }
        });
  
        let agents = await Agent.aggregate(aggregate_obj).allowDiskUse(true);
  
        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'findAgent');
  
        return res.send({
          results: agents
        });
      } catch (err) {
        logger.info('ERR', err);
        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'findAgent');
  
        return res.send({
          results: []
        });
      }
  
    },

    totalUsers: async (agentId) => {
      let count = await User.countDocuments({
        'referral.referred_by': agentId
      });
  
      return count;
    },

    updateStatus: async function(req, res) {
      var startTime = new Date();
  
      var params = _.pick(req.body, ['id', 'status']);
      //logger.info("PARAMS", params);
      if (!params) return res.send(Service.response(0, localization.missingParamError, null));
  
      if (!Service.validateObjectId(params.id)) {
          return res.send(Service.response(0, localization.missingParamError, null));
      }
  
      var rez = await Agent.findByIdAndUpdate(params.id, {
          $set: {
              is_active: params.status == 'true'
          }
      });
  
      var endTime = new Date();
      utility.logElapsedTime(req, startTime, endTime, 'updateStatus');
  
      if (rez){
          var newLog = new AccessLog({
              admin: req.admin._id,
              action: `${params.status == 'true' ? 'Activated':'Deacivated'} agent's account`,
              agent: params.id,
              created_at: new Date().getTime()
          });
          await newLog.save();
  
          return res.send(Service.response(1, localization.success, null));
      }
      else return res.send(Service.response(0, localization.serverError, null));
    },

    getAgentListAjax: async (req, res, next) => {
      let startTime = new Date();
  
      try {
        const params = req.query;
        let obj = {
          is_deleted: false
        };
        if (params.search) {
          if (params.search.value.trim() != '') {
            obj['$or'] = [{
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
            } else if (params.order[0].column == '1') {
              // SORT BY USERNAME
              sortObj.username = params.order[0].dir == 'asc' ? 1 : -1;
            } else if (params.order[0].column == '6') {
              // SORT BY REG DATE
              sortObj.created_at = params.order[0].dir == 'asc' ? 1 : -1;
            } else if (params.order[0].column == '7') {
              // SORT BY IS_ACTIVE
              sortObj.is_active = params.order[0].dir == 'asc' ? 1 : -1;
            } else {
              sortObj = {
                created_at: -1
              };
            }
          } else {
            sortObj = {
              created_at: -1
            };
          }
        } else {
          sortObj = {
            created_at: -1
          };
        }
  
        let list = await Agent.aggregate([{
          $match: obj
        }, {
          $sort: sortObj
        }, {
          $skip: parseInt(params.start)
        }, {
          $limit: params.length == -1 ? '' : parseInt(params.length)
        }]).allowDiskUse(true);
  
        list = await Promise.all(
          list.map(async a => { 
            return [
              a.name,
              a.username,
              a.email,
              `${a.mobile_no.country_code} ${a.mobile_no.number}`,
              a.referral_code,
              a.commission_wallet || 0,
              a.created_at,
              `<small class="label bg-${a.is_active ? 'green' : 'red'}">${
                    a.is_active ? 'Active' : 'Inactive'
              }</small>`,
              `<a target="_blank" href="${config.pre + req.headers.host}/agent/view/${
                a._id
            }" class="on-editing save-row"><i class="fa fa-eye"></i></a>`
            ];
          })
        );
  
        let total = await Agent.find({
          is_deleted: true
        }).countDocuments();
        let total_f = await Agent.find(obj).countDocuments();
  
        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'getAgentListAjax');
  
        return res.status(200).send({
          data: list,
          draw: new Date().getTime(),
          recordsTotal: total,
          recordsFiltered: total_f
        });
      } catch (err) {
        let endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'getAgentListAjax');
        return res.send(Service.response(0, localization.serverError, err.message));
      }
    }
}