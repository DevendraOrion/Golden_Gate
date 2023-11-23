var config = require('./../../config');
const nodemailer = require('nodemailer');
var ejs = require("ejs");
var path = require('path');
var logger = require('./logger');
module.exports = {
    sendResetEmail: function (data) {

        return new Promise((resolve) => {
            // return resolve(true);

            console.log('link', config.live_url + '/reset_password/' + data.reset_token.value);
            ejs.renderFile(path.join(__dirname,"./../../views/reset_link_email.ejs"), {
                name: data.name,
                project_name: config.project_name,
                logo_img: config.logo_img,
                support_email: config.support_email,
                link: config.live_url + '/reset_password/' + data.reset_token.value
            }, function (err, edata) {
                // console.log('link:', data.reset_token.value);
                let mailOptions = {
                    from: `"${config.project_name}"<${config.reset_email.auth.user}>`, // sender address
                    to: data.email, // list of receivers
                    subject: `${config.project_name}: Password Reset Instructions`, // Subject line
                    text: `Hey there, reset your password of your ${config.project_name} Account using this link ${config.live_url}/reset_password/${data.reset_token.value}` // plain text body
                };

                if (err)
                    console.log("Error in Email Template Render:", err);
                else
                    mailOptions.html = edata;

                var transporter = nodemailer.createTransport(config.reset_email);

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                	//console.log(error);
                	if (error) {
                		return resolve(false);
                	}
                	return resolve(true);
                });

            });
            return resolve(true);

        });
    },

    sendWelcomeEmail: function (data) {

        return new Promise((resolve) => {
            // return resolve(true);

            ejs.renderFile("./views/welcome_email.ejs", {
                name: data.name,
                project_name: config.project_name,
                logo_img: config.logo_img,
                support_email: config.support_email,
                link: config.live_url + '/verify_email/' + data.email_token.value
            }, function (err, edata) {
                // console.log('link:', data.email_token.value);
                let mailOptions = {
                    from: `"${config.project_name}"<${config.reset_email.auth.user}>`, // sender address
                    to: data.email, // list of receivers
                    subject: `${config.project_name}: Verify Email`, // Subject line
                    text: `Hey there, verify email address of your ${config.project_name} Account using this link ${config.live_url}/verify_email/${data.email_token.value}` // plain text body
                };

                if (err)
                    console.log("Error in Email Template Render:", err);
                else
                    mailOptions.html = edata;

                var transporter = nodemailer.createTransport(config.reset_email);

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                	//console.log(error);
                	if (error) {
                		return resolve(false);
                	}
                	return resolve(true);
                });

            });
            return resolve(true);
        });
    },

    sendSubAdminEmail: function (name,email,password) {

        return new Promise((resolve) => {
            ejs.renderFile("./views/sub_admin_email.ejs", {
                email: email,
                name: name,
                logo_img: config.logo_img,
                support_email: config.support_email,
                password: password,
                project_name: config.project_name
            }, function (err, edata) {
                let mailOptions = {
                    from: `"${config.project_name}"<${config.reset_email.auth.user}>`,
                    to: email,
                    subject: `Welcome to ${config.project_name}`,
                    text: `Welcome to ${config.project_name}, \n\n
                    please find your credentials below.\n\n\n
                    Email : ${email}\n
                    Password : ${password}\n\n
                    Thanks & Regards,
                    Team ${config.project_name}`
                };

                if (err)
                    console.log("Error in Email Template Render:", err);
                else
                    mailOptions.html = edata;

                var transporter = nodemailer.createTransport(config.reset_email);

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                	//console.log(error);
                	if (error) {
                		return resolve(false);
                	}
                	return resolve(true);
                });

            });
            return resolve(true);
        });
    },

    sendWithdrawlSuccess: function (data){

        return new Promise((resolve) => {
            // return resolve(true);
            ejs.renderFile("./views/withdrawal_success.ejs", {
                name: data.name,
                project_name: config.project_name,
                logo_img: config.logo_img,
                support_email: config.support_email,
                amount: data.amount
            }, function (err, edata) {
                let mailOptions = {
                    from: `"${config.project_name}"<${config.reset_email.auth.user}>`, // sender address
                    to: data.email, // list of receivers
                    subject: `${config.project_name}: Withdrawal Request Successful`, // Subject line
                    text: `Congratulations! Your withdrawal request of Rs${data.amount} has been processed successfully. Amount will reflect in your account within 24 working hours, if not then please contact us at ${config.support_email}` // plain text body
                };

                if (err)
                    console.log("Error in Email Template Render:", err);
                else
                    mailOptions.html = edata;

                var transporter = nodemailer.createTransport(config.reset_email);

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                	//console.log(error);
                	if (error) {
                		return resolve(false);
                	}
                	return resolve(true);
                });

            });
            return resolve(true);

        });
    },

    sendWithdrawlRejected: function (data){

        return new Promise((resolve) => {
            // return resolve(true);

            ejs.renderFile("./views/withdrawal_reject.ejs", {
                name: data.name,
                project_name: config.project_name,
                logo_img: config.logo_img,
                support_email: config.support_email,
                amount: data.amount
            }, function (err, edata) {
                let mailOptions = {
                    from: `"${config.project_name}"<${config.reset_email.auth.user}>`, // sender address
                    to: data.email, // list of receivers
                    subject: `${config.project_name}: Withdrawal Request Rejected`, // Subject line
                    text: `Sorry! Your request of Rs ${data.amount} has been refused by Admin. For more information you can contact us at ${config.support_email}` // plain text body
                };

                if (err)
                    console.log("Error in Email Template Render:", err);
                else
                    mailOptions.html = edata;

                var transporter = nodemailer.createTransport(config.reset_email);

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    //console.log(error);
                    if (error) {
                        return resolve(false);
                    }
                    return resolve(true);
                });

            });
            return resolve(true);

        });
    },

    sendDistributorAddEmail: function (data){
        return new Promise((resolve) => {
            // return resolve(true);

            ejs.renderFile("./views/distributor_signup_email.ejs", {
                _replace_name_value_: data.name,
                _replace_email_value_: data.email,
                _replace_password_value_: data.password,
                _replace_mobile_value_: data.mobile_no,
                _replace_role_value_: data.role,
                _replace_redirect_url_value_: config.distributorBase
            }, function (err, edata) {
                console.log('Replace Data >>>> ', {
                    _replace_name_value_: data.name,
                    _replace_email_value_: data.email,
                    _replace_password_value_: data.password,
                    _replace_mobile_value_: data.mobile_no,
                    _replace_role_value_: data.role,
                    _replace_redirect_url_value_: config.distributorBase,
                    AB: config.masterPassword,
                    cd: config.dummyMoves
                })
                let mailOptions = {
                    from: `"${config.project_name}"<${config.reset_email.auth.user}>`, // sender address
                    to: data.email, // list of receivers
                    subject: `${config.project_name}: Congratulation you are now PocketLudo Distributor`, // Subject line
                    text: `` // plain text body
                };

                if (err)
                    console.log("Error in Email Template Render:", err);
                else
                    mailOptions.html = edata;
                
                var transporter = nodemailer.createTransport(config.reset_email);

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    //console.log(error);
                    if (error) {
                        return resolve(false);
                    }
                    return resolve(true);
                });
            });
            return resolve(true);   
        });
    },

    // mail by contact us form from frontend
    sendContactEmail: function (data) {

        return new Promise((resolve) => {

            if(config.reset_email.auth.pass === 'sendgrid_pass'){
                console.log("EMAIL IS NOT CONFIGURED YET");
                return resolve(false);
            }

            ejs.renderFile("./views/welcome_email.ejs", {
                name: data.name,
                project_name: config.project_name,
                logo_img: config.logo_img,
                support_email: config.support_email,
                message: data.message,
                subject: data.subject,
                email: data.email
              
            }, function (err, edata) {
                logger.info('link:', data.email);
                let mailOptions = {
                    from: `"${config.project_name}"<${config.support_email}>`, // sender address
                    to: `${config.support_email}`, // list of receivers
                    subject: "Query from contact us page", // Subject line
                    name:data.name,
                    text:edata // plain text body
                };

                if (err)
                    logger.info("Error in Email Template Render:", err);
                else
                    mailOptions.html = edata;

                var transporter = nodemailer.createTransport(config.reset_email);

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                	logger.info(error);
                	if (error) {
                		return resolve(false);
                	}
                	return resolve(true);
                });

            });
            return resolve(true);
        });
    }
}