const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  noticeId: {
    type: Number,
    // required: true,
    // default: '',
  },
  notice: {
    type: String,
    // required: true,
    default: '',
  },
  userList: {
    type: String,
    // required: true,
    default: '',
  },
  created_at: {
    type: String,
    // required: true,
    default: Date.now,
  },
  noticeDate: {
    type: String,
    // required: true,
    default: '',
  },
  noticeTitle: {
    type: String,
    default: '', 
  },
  status: {
    type: Number,
    default: 1, 
  },
  // Other fields in your schema...
});


const Notice = mongoose.model('notice-datas', noticeSchema);

module.exports = Notice;
