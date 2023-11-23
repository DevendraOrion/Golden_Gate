var utility = require("./utilityController");
var { Blogs } = require("../models/blogs");
_ = require("lodash"),
  Service = require("../service"),
  Mailer = require("../service/email"),
  localization = require("../service/localization");
var Cryptr = require("cryptr");
var logger = require("../service/logger");
module.exports = {
  bloglist: async () => {
    const wr = await Blogs.find({})
      .sort({
        created_at: -1,
      })
      .limit(10);
    const list = await Promise.all(
      wr.map(async (w) => {
        return {
          id: w._id,
          title: w.title,
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
    let total = await Blogs.find({}).countDocuments();
    return {
      list,
      total,
    };
  },
  frontbloglist: async () => {
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
    let first = await Blogs.find();
    console.log(first);
    return {
      list,
      first,
    };
  },
  blogAjax: async (req, res) => {
    // Pagination , Search by User name, Sort by Username(1) / Amount(2) / Requested Date(4) / Completed Date(5)
    let i = 0;
    const params = req.query;
    let status = "";
    let matchObj = {};
    const user_id = params.id || "";
    let aggregation_obj = [];
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
    aggregation_obj.push({
      $project: {
        id: "$_id",
        title: "$title",
        slug: "$slug",
        is_published: "$is_published",
        created_at: "$created_at", //await Service.formateDate(parseInt(w.created_at)),
        updated_at: "$updated_at", //await Service.formateDate(parseInt(w.created_at)),
      },
    });
    let list = await Blogs.aggregate(aggregation_obj).allowDiskUse(true);
    let aggregate_rf = [];
    if (matchObj) {
      aggregate_rf.push(
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
    let rF = await Blogs.aggregate(aggregate_rf).allowDiskUse(true);
    let recordsFiltered = rF.length > 0 ? rF[0].count : 0;
    var recordsTotal = await Blogs.find({}).countDocuments();
    let rank = offset + 1;
    list = await Promise.all(
      list.map(async (u) => {
        //logger.info("User Transaction",u);
        return [
          u.id,
          rank++,
          u.title,
          (u.is_published) ? "Yes" : "No",
          moment(Date.parse(u.created_at)).format("YYYY-MM-DD HH:mm A"),
          moment(Date.parse(u.updated_at)).format("YYYY-MM-DD HH:mm A"),
          `<ul class="list-inline">
          <li>
              <a href="javascript:void(0);" id="${u.id}" onClick="changeStatus(this);"><small class="label bg-blue">${(u.is_published) ? "Draft" : "Published"}</small></a>
          </li>
          <li>
              <a href="/blog_ludo_cash/${u.slug}"><small class="label bg-blue">Show</small></a>
          </li>
           <li>
              <a href="/edit_blog/${u.id}"><small class="label bg-blue">Edit</small></a>
          </li>
           <li>
              <a href="javascript:void(0);" id="${u.id}" onClick="checkElement(this);"><small class="label bg-blue">Delete</small></a>
          </li>
      </ul>`
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
  addBlog: async (req, res, next) => {
    let params = _.pick(req.body, 'title', 'body');
    if (_.isEmpty(params)) {
      return res.status(200).json(Service.response(0, localization.missingParamError, null));
    }
    if (
      _.isEmpty(params.title) ||
      _.isEmpty(params.body)) {
      return res.send({
        status: 0,
        message: localization.missingParamError
      });
    }
    if (req.files) {
      if (req.files.blogPicture) {
        params.blogPicture = await Service.uploadFileLocal(req.files.blogPicture, ['jpeg', 'jpg', 'png']);
      }
    } else {
      return res.send({
        status: 0,
        message: localization.missingParamError
      });
    }
    let obj = {
      "admin_id": req.admin._id,
      "title": params.title,
      "body": params.body,
      "slug": (params.title).replace(/[^a-zA-Z ]/g, "").split(" ").join("_").toLowerCase(),
      "image": params.blogPicture || '',
      "created_at": new Date().getTime(),
      "updated_at": new Date().getTime()
    }
    let resp = new Blogs(obj);
    await resp.save();
    if (resp) {
      return res.status(200).json(Service.response(1, localization.success, resp));
    } else {
      return res.status(200).json(Service.response(0, localization.ServerError, err));
    }
  },
  tinyimages: async (req, res) => {
    var startTime = new Date();
    try {
      if (req.files) {
        if (req.files.file) {
          var file;
          file = await Service.uploadFileLocal(
            req.files.file,
            ["jpg", "png", "jpeg"]
          );
          file = process.env.ADMIN_BASE + file.replace('./public', '');
          logger.info("S3 URL", file);
          return res.send({
            status: 0,
            location: file,
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
  blogDelete: async (req, res) => {
    console.log(req.query);
    var query = { _id: req.params.id };
    let resp = await Blogs.deleteOne(query);
    if (resp) {
      return res.status(200).json(Service.response(1, localization.success, resp));
    } else {
      return res.status(200).json(Service.response(0, localization.ServerError, err));
    }
  },
  blogEdit: async (req, res, next) => {
    var query = { _id: req.params.id };
    const blog = await Blogs.findOne(query);
    console.log(blog);
    res.render("admin/editBlog", {
      title: "Blog Management",
      type: "blog",
      sub: "blog",
      sub2: "",
      host: config.pre + req.headers.host,
      admin: req.admin,
      data: blog,
    });
  },
  updateBlog: async (req, res, next) => {
    let params = _.pick(req.body, 'title', 'body');
    if (_.isEmpty(params)) {
      return res.status(200).json(Service.response(0, localization.missingParamError, null));
    }
    if (
      _.isEmpty(params.title) ||
      _.isEmpty(params.body)) {
      return res.send({
        status: 0,
        message: localization.missingParamError
      });
    }
    if (req.files) {
      if (req.files.blogPicture) {
        params.blogPicture = await Service.uploadFileLocal(req.files.blogPicture, ['jpeg', 'jpg', 'png']);
      }
    }
    var query = { _id: req.body._id };
    const blog = await Blogs.findOne(query);
    blog.admin_id = req.admin._id;
    blog.title = params.title;
    blog.body = params.body;
    blog.slug = (params.title).replace(/[^a-zA-Z ]/g, "").split(" ").join("_").toLowerCase();
    blog.image = params.blogPicture || blog.image;
    blog.created_at = new Date().getTime();
    blog.updated_at = new Date().getTime();
    let resp = await blog.save();
    if (resp) {
      return res.status(200).json(Service.response(1, localization.success, resp));
    } else {
      return res.status(200).json(Service.response(0, localization.ServerError, err));
    }
  },
  changeStatus: async (req, res, next) => {
    var query = { _id: req.params.id };
    const blog = await Blogs.findOne(query);
    if (blog.is_published) {
      blog.is_published = false
    }
    else {
      blog.is_published = true
    }
    let resp = await blog.save();
    if (resp) {
      return res.status(200).json(Service.response(1, localization.success, resp));
    } else {
      return res.status(200).json(Service.response(0, localization.ServerError, err));
    }
  }
};
