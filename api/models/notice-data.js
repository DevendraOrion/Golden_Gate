const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  notice: {
    type: String,
    // required: true,
    default: '',
  },
  rules: {
    type: String,
    default: '', // Set a default value (empty string in this case)
  },
  // Other fields in your schema...
});


const Notice = mongoose.model('notice-datas', noticeSchema);

module.exports = Notice;
