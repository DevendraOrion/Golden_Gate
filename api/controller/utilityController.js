const dateFormat = require('dateformat');
var logger = require('./../service/logger');

module.exports = {
    logElapsedTime:function (req, startTime, endTime, funtionName) {
        var diffTime = startTime - endTime;
        logger.info("ElapsedTime | method:" + req.method +
        " |path:" + req.url +
        " |function:" + funtionName +
        " |startTime: " + dateFormat(startTime, "dd/mm/yyyy hh:MM:ss:l") +
        " |endTime: " + dateFormat(new Date(), "dd/mm/yyyy hh:MM:ss:l") +
        " |Diff.: " + diffTime);
        },
        objectId:function() {
            const os = require('os');
            const crypto = require('crypto');
        
            const seconds = Math.floor(new Date()/1000).toString(16);
            const machineId = crypto.createHash('md5').update(os.hostname()).digest('hex').slice(0, 6);
            const processId = process.pid.toString(16).slice(0, 4).padStart(4, '0');
            const counter = process.hrtime()[1].toString(16).slice(0, 6).padStart(6, '0');
        
            return seconds + machineId + processId + counter;
        }
        
};
