var {
	User
} = require('../models/user');
var config = require('../../config');
var request = require('request');
var apikey = config.textLocalKey.apikey;
var senderID = config.textLocalKey.sender;
var logger = require('./logger');
const axios = require('axios');

module.exports = {

	// sendOtp: function (mobile, otp) {

	// 	return new Promise((resolve, reject) => {

	// 		if (config.textLocalKey.apikey === 'text-local-api-key') {
	// 			console.log("SMS Gateway IS NOT CONFIGURED YET");
	// 			return resolve(false);
	// 		}

	// 		var projectname = config.project_name;
	// 		var message = otp + ' is your OTP (One Time Password) to verify your user account on ' + projectname;

	// 		request.post('https://api.textlocal.in/send/', {
	// 			form: {
	// 				apikey: apikey,
	// 				numbers: mobile,
	// 				message: message,
	// 				sender: senderID
	// 			}
	// 		}, function (error, response, body) {
	// 			if (response.statusCode == 200) {
	// 				logger.info('Response:', body);
	// 				var body_obj = JSON.parse(body);
	// 				if (body_obj.status == 'success') {
	// 					//logger.info("OTP Sent!");
	// 					return resolve(true);
	// 				} else {
	// 					return resolve(false);
	// 				}
	// 			} else {
	// 				//logger.info("Server Error", body);
	// 				return resolve(false);
	// 			}
	// 		});
	// 	});
	// },

	// sendOtp: async function (mobile, otp) {
	// 	try {
	// 		let authResponse = await axios.post(config.VPS_RAJA_SMS.url+config.VPS_RAJA_SMS.auth, {
	// 			username: config.VPS_RAJA_SMS.username,
	// 			password: config.VPS_RAJA_SMS.password
	// 		});
	// 		console.log(authResponse.data);
	// 		if (authResponse.data.access_token) {
	// 			console.log("Success");
	// 			let sendSMS = await axios.post(config.VPS_RAJA_SMS.url+config.VPS_RAJA_SMS.send_sms, {
	// 				destinationNumber: `+91${mobile}`,
	// 				sender_id: config.VPS_RAJA_SMS.sender_id,
	// 				message: `${otp} is your OTP (One Time Password) to verify your user account on ${config.project_name}`
	// 			}, {
	// 				headers: {
	// 					Authorization: 'Bearer ' + authResponse.data.access_token
	// 				}
	// 			});
	// 			console.log("send_sms", sendSMS.data);
	// 			if (sendSMS.data.statusCode == 200) {
	// 				console.log("SMS Sent");
	// 				return true;
	// 			} else {
	// 				console.log("SMS Send Error", sendSMS.data);
	// 				return false;
	// 			}
	// 		} else {
	// 			console.log("Fail Error");
	// 			return false;
	// 		}
	// 	} catch (error) {
	// 		console.error(error);
	// 		return false
	// 	}
	// }

	sendOtp: async function (mobile, otp) {
		// For 2factor.in
		try {
			let sendSMS = await axios.get(`https://2factor.in/API/V1/7b844124-ec65-11ea-9fa5-0200cd936042/SMS/+91${mobile}/${otp}/SMS OTP LUDO SHUDO`);
			console.log("send_sms", sendSMS.data);
			if (sendSMS.data.Status == 'Success') {
				console.log("SMS Sent");
				return true;
			} else {
				console.log("SMS Send Error", sendSMS.data);
				return false;
			}
		} catch (error) {
			console.error(error);
			return false
		}
	}
	
}