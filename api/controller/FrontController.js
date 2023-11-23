var { User } = require("../models/user"),
  Table = require("../models/table"),
  { Blogs } = require("../models/blogs");
var config = require("../../config"),
  _ = require("lodash"),
  Service = require("../service"),
  Mailer = require("../service/email"),
  localization = require("../service/localization");
var Cryptr = require("cryptr");
var logger = require("../service/logger");
var { User } = require("./../models/user"),
  Agent = require("./../models/agent"),
  Table = require("./../models/table"),
  kycrequest = require("./../models/kycrequest"),
  { Transaction } = require("./../models/transaction"),
  { Default } = require("./../models/default");
var config = require("./../../config"),
  _ = require("lodash"),
  Service = require("./../service"),
  Mailer = require("./../service/email"),
  Sms = require("./../service/sms"),
  localization = require("./../service/localization");
var bcrypt = require("bcryptjs");
var request = require("request");
var Cryptr = require("cryptr");
var cryptr = new Cryptr(config.cryptrSecret);
var logger = require("./../service/logger");
var utility = require("./utilityController");
var fs = require("fs");
// var ObjectId = require('mongoose').Types.ObjectId;
var timeago = require("timeago.js");
var randomString = require("random-string");
// var timeagoInstance = timeago();
const AdminController = require("./adminController");
const paymentController = require("./paymentController");
const distributorController = require("./distributorController");
const AgentController = require("./agentController");
config = require("./../../config"),
  { User } = require("./../models/user"),
  { AccessLog } = require("./../models/accessLog"),
  Table = require("./../models/table"),
  Admin = require("./../models/superAdmin"),
  _ = require("lodash"),
  localization = require("./../service/localization");
const kycController = require("./kycController");
const blogController = require("./blogController");
module.exports = {
  index: async (req, res) => {
    const wr = await Blogs.find({})
      .sort({
        created_at: -1,
      })
      .limit(6)
      .find({ is_published: true });
    // wr[0].image= wr[0].image.replace("./public", "");
    res.render("front/index", {
      data: wr,
      host: config.pre + req.headers.host,
    });
  },
  about: async (req, res) => {
    res.render("front/about", {
    });
  },
  contact: async (req, res) => {
    res.render("front/contact", {
    });
  },
  service: async (req, res) => {
    res.render("front/service", {
    });
  },
  privacy_policy: async (req, res) => {
    res.render("front/privacy-policy", {
    });
  },
  t$C: async (req, res) => {
    res.render("front/terms-condition", {
    });
  },
  refundPolicy: async (req, res) => {
    res.render("front/refund-policy", {
    });
  },
  SendEmail: async function (req, res) {
    //logger.info("Resend Email Verification Link Request >> ", req.body);
    var params = _.pick(req.body, 'name', 'email', 'subject', 'message');
    if (_.isEmpty(params)) {
      return res.status(200).json(Service.response(0, localization.missingParamError, null));
    }
    if (_.isEmpty(params.name) || _.isEmpty(params.email) || _.isEmpty(params.subject) || _.isEmpty(params.message)) {
      //logger.info("required parameter is missing");
      return res.status(200).json(Service.response(0, localization.missingParamError, null));
    }
    if (!Service.validateEmail(params.email))
      return res.status(200).json(Service.response(0, localization.emailValidationError, null));
    var userdata = _.pick(
      params,
      'name',
      'email',
      'subject',
      'message'
    );
    if (!userdata) return res.status(200).json(Service.response(0, localization.ServerError, null));
    var sendMailRes = await Mailer.sendContactEmail(userdata);
    //logger.info("SEND MAIL RES", sendMailRes);
    if (sendMailRes) {
      //logger.info("Welcome Email Sent");
      return res.status(200).json(Service.response(1, "Email sent successfully. Admin will be contact you soon.", null));
    } else {
      //logger.info("Welcome Email Error");
      return res.status(200).json(Service.response(0, localization.ServerError, null));
    }
  },
  post: async (req, res) => {
    res.render("front/post", {
    });
  },
  frontbloglist: async (req, res, next) => {
    const wr = await Blogs.find({})
      .sort({
        created_at: -1,
      })
      .limit(10)
      .find({ is_published: true });
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          title: w.title,
          image: w.image,
          slug: w.slug,
          published: w.is_published,
          created: moment(Date.parse(w.created_at)).format(
            "YYYY-MM-DD HH:mm A"
          ), //await Service.formateDate(parseInt(w.created_at)),
          updated: moment(Date.parse(w.updated_at)).format(
            "YYYY-MM-DD HH:mm A"
          )
        };
      })
    );
    const first = await Blogs.findOne();
    list[0].image = list[0].image.replace("./public", "");
    res.render("front/post", {
      title: "Blog Details",
      type: "users",
      sub: "Blog",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: list,
      first: first,
    });
  },
  findBlog: async (req, res, next) => {
    const wr = await Blogs.find({})
      .sort({
        created_at: -1,
      })
      .limit(10)
      .find({ is_published: true });
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          title: w.title,
          image: w.image,
          slug: w.slug,
          published: w.is_published,
          created: moment(Date.parse(w.created_at)).format(
            "YYYY-MM-DD HH:mm A"
          ), //await Service.formateDate(parseInt(w.created_at)),
          updated: moment(Date.parse(w.updated_at)).format(
            "YYYY-MM-DD HH:mm A"
          )
        };
      })
    );
    console.log(req.params.id);
    var query = { slug: req.params.id };
    const post = await Blogs.find(query);
    console.log(post);
    res.render("front/post", {
      title: "Blog Details",
      type: "users",
      sub: "Blog",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: list,
      post: post[0],
    });
  }
};