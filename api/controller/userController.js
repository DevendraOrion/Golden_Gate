var { User } = require('./../models/user'),
    Table = require('./../models/table'),
    { Transaction } = require('./../models/transaction'),
    { AccessLog } = require('./../models/accessLog'),
    { Default } = require('./../models/default');
var config = require('./../../config'),
    _ = require('lodash'),
    Service = require('./../service'),
    Mailer = require('./../service/email'),
    Sms = require('./../service/sms'),
    localization = require('./../service/localization');
var bcrypt = require('bcryptjs');
var request = require('request');
var Cryptr = require('cryptr');
var cryptr = new Cryptr(config.cryptrSecret);
var logger = require('./../service/logger');
var utility = require('./utilityController');
// var ObjectId = require('mongoose').Types.ObjectId;

var timeago = require('timeago.js');
var randomString = require('random-string');
// var timeagoInstance = timeago();

module.exports = {
    signup: async function (req, res) {
        var startTime = new Date();
        var params = _.pick(
            req.body,
            'name',
            'username',
            'email',
            'mobile_no',
            'password',
            'referral_code',
            'device_id',
            'app_version',
            'facebook_id',
            'onesignal_id',
            'deviceName',
            'deviceModel',
            'os',
            'processorType',
            'systemMemorySize'
        );

        //logger.info("Signup Request:", params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (
            _.isEmpty(params.name) ||
            _.isEmpty(params.username) ||
            _.isEmpty(params.email) ||
            _.isEmpty(params.mobile_no) ||
            _.isEmpty(params.onesignal_id) ||
            _.isEmpty(params.device_id)
        ) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        var uniqueUserName = await Service.uniqueUserName(params.username);

        if (uniqueUserName.status === false)
            return res.status(200).json(Service.response(0, localization.uniqueUserNameError, null));

        if (params.username.trim().length < 3 || params.username.trim().length > 12)
            return res.status(200).json(Service.response(0, localization.usernameValidationError, null));

        if (!Service.validateEmail(params.email))
            return res.status(200).json(Service.response(0, localization.emailValidationError, null));

        if (isNaN(params.mobile_no) || params.mobile_no.trim().length != 10)
            return res.status(200).json(Service.response(0, localization.mobileValidationError, null));

        //For FB login
        if (params.facebook_id) {
            var fb_us = await User.findOne({
                facebook_id: params.facebook_id
            });

            if (fb_us) {
                let token = await Service.issueToken(params);
                var us_update = await fb_us.updateOne({
                    user_device: {
                        name: params.deviceName || '',
                        model: params.deviceModel || '',
                        os: params.os || '',
                        processor: params.processorType || '',
                        ram: params.systemMemorySize || ''
                    },
                    tokens: [
                        {
                            token: token,
                            access: 'auth'
                        }
                    ]
                });

                var userdata = _.pick(
                    fb_us,
                    'name',
                    'username',
                    'email',
                    'profilepic',
                    'otp_verified',
                    'numeric_id',
                    'email_verified',
                    'main_wallet',
                    'win_wallet',
                    'facebook_id'
                );
                userdata.token = token;
                userdata.referral_code = fb_us.referral.referral_code;
                userdata.mobileno = fb_us.mobile_no.number;

                if (us_update) return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
                else return res.status(200).json(Service.response(0, localization.ServerError, null));
            }
        } else {
            if (!params.password)
                return res.status(200).json(Service.response(0, localization.missingParamError, null));

            if (params.password.trim().length < 6 || params.password.trim().length > 12)
                return res.status(200).json(Service.response(0, localization.passwordValidationError, null));

            var hash = bcrypt.hashSync(params.password);
        }

        var us = await User.findOne({
            email: params.email.trim()
        });

        if (us) return res.status(200).json(Service.response(0, localization.emailExistError, null));

        us = await User.findOne({
            'mobile_no.number': params.mobile_no
        });

        if (us) return res.status(200).json(Service.response(0, localization.mobileExistError, null));

        var otpGenerate = await Service.generateOtp(params);

        if (!otpGenerate.status) return res.status(200).json(Service.response(0, localization.otpGenerateError, null));

        // SEND MESSAGE OTP HERE
        Sms.sendOtp(params.mobile_no, otpGenerate.otp)
            .then(d => {
                logger.info('OPT Sent', d);
            })
            .catch(e => {
                logger.info('OTP Send Error::', e);
            });

        var token = await Service.issueToken(params);

        if (!params.device_type) {
            params.device_type = 'android';
        }

        if (!params.country_code) {
            params.country_code = '+91';
        }

        var to = {
            access: params.device_type.toLowerCase(),
            token: token
        };

        if (req.files) {
            if (req.files.profile_pic) {
                var aws_img_url;
                aws_img_url = await Service.uploadFile(req.files.profile_pic, ['jpg', 'png', 'jpeg']);
                //logger.info('S3 URL', aws_img_url);
            }
        }

        var r_code;
        if (params.referral_code) {
            r_code = await User.findOne({
                'referral.referral_code': params.referral_code
            });

            if (!r_code) return res.status(200).json(Service.response(0, localization.invalidReferralCodeError, null));

            var referred_by_id = r_code._id;
        }

        var referral_code = await randomString({
            length: 8,
            numeric: true,
            letters: true,
            special: false
        });
        while (true) {
            let ref_user = await User.findOne({
                'referral.referral_code': referral_code
            });

            if (ref_user)
                referral_code = await randomString({
                    length: 8,
                    numeric: true,
                    letters: true,
                    special: false
                });
            else break;
        }

        var maxNumId = await User.find({}, ['numeric_id'])
            .sort({
                numeric_id: -1
            })
            .limit(1);
        var numeric_id;
        if (maxNumId.length == 0) numeric_id = 11111;
        else {
            if (maxNumId[0].numeric_id) numeric_id = maxNumId[0].numeric_id + 1;
            else numeric_id = 11111;
        }

        var newUser = new User({
            name: params.name,
            username: params.username,
            numeric_id: numeric_id,
            email: params.email,
            facebook_id: params.facebook_id || '',
            created_at: new Date().getTime(),
            profilepic: aws_img_url || config.default_user_pic,
            mobile_no: {
                country_code: params.country_code,
                number: params.mobile_no
            },
            otp: {
                value: otpGenerate.otp,
                expired_at: new Date().getTime() + config.OPT_EXPIRED_IN_MINUTES * 60 * 1000
            },
            referral: {
                referral_code: referral_code,
                referred_by: referred_by_id || ''
            },
            device_id: params.device_id,
            onesignal_id: params.onesignal_id,
            password: hash || '',
            user_device: {
                name: params.deviceName || '',
                model: params.deviceModel || '',
                os: params.os || '',
                processor: params.processorType || '',
                ram: params.systemMemorySize || ''
            },
            tokens: [to]
        });

        if (params.app_version) {
            newUser.app_version = params.app_version;
        }

        var email_token = cryptr.encrypt(newUser.email);

        newUser.email_token.value = email_token;
        newUser.email_token.expired_at = new Date().getTime() + config.EMAIL_LINK_EXPIRED_IN_MINUTES * 60 * 1000;

        var newUserSave = await newUser.save();
        console.log('USER SAVED', newUserSave);
        var userdata = _.pick(
            newUserSave,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet',
            'facebook_id'
        );
        userdata.token = token;
        userdata.referral_code = newUserSave.referral.referral_code;
        userdata.mobileno = newUserSave.mobile_no.number;

        if (!newUserSave) {
            console.log('HERE');
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        } else {
            console.log('THERE');
            var order_id = utility.objectId();
            var newTxn = new Transaction({
                user_id: newUserSave._id,
                txn_amount: 30,
                txn_win_amount: 0,
                txn_main_amount: 30,
                order_id: order_id,
                created_at: new Date().getTime(),
                transaction_type: 'C',
                resp_msg: 'Joining bonus',
                is_status: 'S',
                txn_mode: 'B'
            });

            await newTxn
                .save()
                .then(c => {
                    console.log('TXN SAVED', c);
                })
                .catch(err => {
                    console.log('ERROR', err);
                });
        }

        // SEND EMAIL OTP HERE
        var sendMailRes = await Mailer.sendWelcomeEmail(newUserSave);
        logger.info('SEND MAIL RES', sendMailRes);
        // if (sendMailRes) {
        // 	logger.info("Welcome Email Sent");
        // } else {
        // 	logger.info("Welcome Email Error");
        // }

        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'signup');

        return res.status(200).json(Service.response(1, localization.registerSuccess, userdata));
    },

    fblogin: async function (req, res) {
        var startTime = new Date();
        var params = _.pick(
            req.body,
            'facebook_id',
            'device_id',
            'platform',
            'app_version',
            'deviceName',
            'deviceModel',
            'os',
            'processorType',
            'systemMemorySize'
        );

        //logger.info("FB Login Request:", params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (
            _.isEmpty(params.facebook_id) ||
            _.isEmpty(params.device_id) ||
            _.isEmpty(params.platform) ||
            _.isEmpty(params.app_version)
        ) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        var flag = false;

        var fb_us = await User.findOne({
            facebook_id: params.facebook_id
        });

        if (fb_us) {
            var token = await Service.issueToken(params);
            var us_update = await fb_us.updateOne({
                user_device: {
                    name: params.deviceName || '',
                    model: params.deviceModel || '',
                    os: params.os || '',
                    processor: params.processorType || '',
                    ram: params.systemMemorySize || ''
                },
                tokens: [
                    {
                        token: token,
                        access: 'auth'
                    }
                ]
            });

            var fblogin_totalWin = await Table.find({
                'players.id': fb_us._id,
                'players.pl': {
                    $gt: 0
                }
            }).countDocuments();

            var fblogin_totalMatch = await Table.find({
                'players.id': fb_us._id
            });

            var userdata = _.pick(
                fb_us,
                'name',
                'username',
                'email',
                'profilepic',
                'otp_verified',
                'numeric_id',
                'email_verified',
                'main_wallet',
                'win_wallet',
                'facebook_id'
            );
            userdata.token = token;
            userdata.referral_code = fb_us.referral.referral_code;
            userdata.mobileno = fb_us.mobile_no.number;
            userdata.total_match = fblogin_totalMatch.length || 0;
            userdata.total_win = fblogin_totalWin || 0;

            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'fblogin');

            if (us_update) return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
            else return res.status(200).json(Service.response(0, localization.ServerError, null));
        } else {
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'fblogin');

            flag = true;
            //logger.info("User not found");
            return res.status(200).json(Service.response(2, localization.newFbAccountError, null));
        }
    },

    login: async function (req, res) {
        var startTime = new Date();

        var params = _.pick(
            req.body,
            'mobile_no',
            'password',
            'device_id',
            'onesignal_id',
            'deviceName',
            'deviceModel',
            'os',
            'processorType',
            'systemMemorySize'
        );

        //logger.info("Normal Login Request:", params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.mobile_no) || _.isEmpty(params.device_id) || _.isEmpty(params.password)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (isNaN(params.mobile_no) || params.mobile_no.trim().length != 10)
            return res.status(200).json(Service.response(0, localization.mobileValidationError, null));

        var user = await User.findOne({
            'mobile_no.number': params.mobile_no
        });

        if (!user) return res.status(200).json(Service.response(0, localization.invalidCredentials, null));

        var rez1 = await bcrypt.compare(params.password, user.password);

        if (!rez1) return res.status(200).json(Service.response(0, localization.invalidCredentials, null));

        if (!user.is_active) return res.status(200).json(Service.response(0, localization.accountDeactivated, null));

        if (user.is_deleted) return res.status(200).json(Service.response(0, localization.accountDeleted, null));

        // Check if user is already playing
        let alreadyPlaying = await Table.findOne({
            'players.id': user._id,
            game_completed_at: -1,
            $or: [
                {
                    game_started_at: {
                        $exists: false
                    }
                },
                {
                    $and: [
                        {
                            game_started_at: {
                                $exists: true
                            }
                        },
                        {
                            game_started_at: { $ne: -1 }
                        }
                    ]
                }
            ]
        });

        //logger.info("ALREADYPLAING", alreadyPlaying);

        if (alreadyPlaying) return res.status(200).json(Service.response(0, localization.alreadyPlaying, null));

        var token = await Service.issueToken(params);
        var us_update = await user.updateOne({
            onesignal_id: params.onesignal_id || '',
            user_device: {
                name: params.deviceName || '',
                model: params.deviceModel || '',
                os: params.os || '',
                processor: params.processorType || '',
                ram: params.systemMemorySize || ''
            },
            tokens: [
                {
                    token: token,
                    access: 'auth'
                }
            ]
        });

        var totalWin = await Table.find({
            'players.id': user._id,
            'players.pl': {
                $gt: 0
            }
        }).countDocuments();

        var totalMatch = await Table.find({
            'players.id': user._id
        });

        var userdata = _.pick(
            user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet',
            'facebook_id'
        );
        userdata.token = token;
        userdata.referral_code = user.referral.referral_code;
        userdata.mobileno = user.mobile_no.number;
        userdata.total_match = totalMatch.length || 0;
        userdata.total_win = totalWin || 0;

        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'login');

        if (us_update) {
            //logger.info("Login True");
            return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
        } else {
            //logger.info("Login False");
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }
    },

    verify_otp: async function (req, res) {
        var startTime = new Date();

        var params = _.pick(req.body, 'otp', 'token', 'numeric_id');

        logger.info('VERIFY OTP REQUEST >> ', params);

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.otp)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        var user = false;

        if (!_.isEmpty(params.token)) {
            user = await User.findOne({
                'tokens': params.token
            });
        }

        if (!user) {
            if (!_.isEmpty(params.numeric_id)) {
                user = await User.findOne({ numeric_id: params.numeric_id });
            }
        }

        if (!user) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        // if (user)
        // 	logger.info("User Found with is token");

        if (user.otp.value != params.otp)
            return res.status(200).json(Service.response(0, localization.otpValidationError, null));

        if (user.otp.expired_at < new Date().getTime())
            return res.status(200).json(Service.response(0, localization.otpExpired, null));

        user.otp_verified = true;
        user.otp.value = '';
        user.otp.expired_at = 0;

        var us_update = await user.updateOne({
            otp: {
                value: '',
                expired_at: 0
            },
            otp_verified: true
        });

        // THIS USER EMAIL & OTP BOTH VERIFIED
        // REFERAL BONUS NOT PASSED ALREADY
        // GET REFERRAL USER
        // ADD BONUS IN REFERRAL USER MAIN WALLET
        // MARK AS REFERAL BONUS PASSED

        logger.info('USER', user);

        if (user.email_verified === true && user.otp_verified === true) {
            logger.info('VERIFIED');
            if (!user.ref_bonus_passed) {
                logger.info('NOT PASSED YET');
                // find user >> req.ref_user
                // add bonus in that user

                // let ref_user = await User.findOne({
                //     'ref_user': req.ref_user
                // });

                if (Service.validateObjectId(user.referral.referred_by)) {
                    let ref_user = await User.findOne({
                        _id: user.referral.referred_by
                    });

                    logger.info('Ref_User', ref_user);

                    if (ref_user) {
                        // ref_user.main_wallet = main_wallet + 5;
                        let update_ = await User.findByIdAndUpdate(
                            ref_user._id,
                            {
                                $inc: {
                                    main_wallet: config.ref_bonus
                                }
                            },
                            {
                                new: true
                            }
                        );
                        logger.info('Referral User', update_.main_wallet);

                        await User.findByIdAndUpdate(user._id, {
                            $set: {
                                ref_bonus_passed: true,
                                'referral.amount': config.ref_bonus
                            }
                        });

                        var order_id = utility.objectId();
                        var newTxn = new Transaction({
                            user_id: ref_user._id,
                            txn_amount: config.ref_bonus,
                            txn_win_amount: 0,
                            txn_main_amount: config.ref_bonus,
                            order_id: order_id,
                            created_at: new Date().getTime(),
                            transaction_type: 'C',
                            resp_msg: 'Referral bonus for ' + user.numeric_id,
                            is_status: 'S',
                            txn_mode: 'REF'
                        });

                        await newTxn
                            .save()
                            .then(c => {
                                console.log('TXN SAVED', c);
                            })
                            .catch(err => {
                                console.log('ERROR', err);
                            });
                    }
                }
            }
        }

        var userdata = _.pick(
            user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet'
        );
        userdata.token = params.token;
        userdata.referral_code = user.referral.referral_code;
        userdata.mobileno = user.mobile_no.number;

        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'verify_otp');

        if (!us_update) return res.status(200).json(Service.response(0, localization.ServerError, null));

        //respond with token
        return res.status(200).json(Service.response(1, localization.loginSuccess, userdata));
    },

    sendOtp: async function (req, res) {
        var startTime = new Date();

        //logger.info("Send OTP REQUEST >> ", req.body);

        var otpGenerate = await Service.generateOtp(req.user);

        if (!otpGenerate.status) return res.status(200).json(Service.response(0, localization.otpGenerateError, null));

        //SEND MESSAGE OTP HERE
        Sms.sendOtp(req.user.mobile_no.number, otpGenerate.otp)
            .then(d => {
                logger.info('OPT Sent', d);
            })
            .catch(e => {
                logger.info('OTP Send Error::', e);
            });

        req.user.otp.value = otpGenerate.otp;
        req.user.otp.expired_at = new Date().getTime() + config.OPT_EXPIRED_IN_MINUTES * 60 * 1000;

        try {
            var usSave = await req.user.save();
        } catch (err) {
            //logger.info("Error while user save", err);
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }

        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'sendotp');

        if (!usSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        return res.status(200).json(Service.response(1, localization.OtpSent, null));
    },

    profileUpdate: async function (req, res) {
        //logger.info("Profile Update Request >> ", req.body);

        var params = _.pick(req.body, 'name', 'email', 'push_status');

        if (params.name) {
            req.user.name = params.name;
        }

        if (params.email) {
            if (!Service.validateEmail(params.email))
                return res.status(200).json(Service.response(0, localization.emailValidationError, null));

            var us = await User.findOne({
                email: params.email.trim()
            });

            if (us) return res.status(200).json(Service.response(0, localization.emailExistError, null));

            req.user.email = params.email;
        }

        if (params.push_status) {
            if (params.push_status === 'true') {
                //logger.info("Push Status:", params.push_status);
                req.user.push_enable = true;
            }

            if (params.push_status === 'false') {
                //logger.info("Push Status:", params.push_status);
                req.user.push_enable = false;
            }
        }

        if (req.files) {
            if (req.files.profile_pic) {
                var aws_img_url;
                aws_img_url = await Service.uploadFile(req.files.profile_pic, ['jpg', 'png', 'jpeg']);
                req.user.profilepic = aws_img_url;
                //logger.info('S3 URL', aws_img_url);
            }
        }

        try {
            var usSave = await req.user.save();
        } catch (err) {
            //logger.info("Error while user save", err);
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }

        if (!usSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        var userdata = _.pick(
            req.user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet'
        );
        userdata.token = req.body.token;
        userdata.referral_code = req.user.referral.referral_code;
        userdata.mobileno = req.user.mobile_no.number;
        return res.status(200).json(Service.response(1, localization.profileUpdateError, userdata));
    },

    updatePassword: async function (req, res) {
        //logger.info("Password Update Request >> ", req.body);

        var params = _.pick(req.body, 'old_password', 'new_password');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.old_password) || _.isEmpty(params.new_password)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        var rez1 = await bcrypt.compare(params.old_password, req.user.password);

        if (!rez1) return res.status(200).json(Service.response(0, localization.incorrectPassword, null));

        if (params.new_password.trim().length < 6 || params.new_password.trim().length > 12)
            return res.status(200).json(Service.response(0, localization.passwordValidationError, null));

        var hash = bcrypt.hashSync(params.new_password);

        req.user.password = hash;

        var userSave = await req.user.save();

        if (!userSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        return res.status(200).json(Service.response(1, localization.changePasswordSuccess, null));
    },

    passwordReset: async function (req, res) {
        logger.info('Password Reset Request >> ', req.body);

        var params = _.pick(req.body, 'email');

        if (!Service.validateEmail(params.email))
            return res.status(200).json(Service.response(0, localization.emailValidationError, null));

        var us = await User.findOne({
            email: {
                $regex: '^' + params.email + '$',
                $options: 'i'
            }
        });

        if (!us) {
            return res.status(200).json(Service.response(0, localization.emailAccountDoesNotExistError, null));
        }

        if (us.reset_token) {
            if (us.reset_token.expired_at > new Date().getTime()) {
                // Send success, no email
                return res.status(200).json(Service.response(1, localization.resetEmailAlreadySent, null));
            }
        }

        var token = cryptr.encrypt(us._id);

        us.reset_token.value = token;
        us.reset_token.expired_at = new Date().getTime() + config.RESET_EMAIL_EXPIRED_IN_MINUTES * 60 * 1000;

        var usSave = await us.save();

        if (!usSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        var sendMailRes = await Mailer.sendResetEmail(usSave);
        logger.info('SEND MAIL RES', sendMailRes);
        if (sendMailRes) {
            return res.status(200).json(Service.response(1, localization.resetPasswordEmailSent, null));
        } else {
            return res.status(200).json(Service.response(0, localization.resetPasswordEmailError, null));
        }
    },

    pushTest: async function (req, res) {
        var startTime = new Date();

        //logger.info("Test Push Request >> ", req.body);

        var params = _.pick(req.body, 'onesignal_id', 'msg');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.onesignal_id) || _.isEmpty(params.msg)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        var message = {
            app_id: config.ONESIGNAL_APP_ID,
            contents: {
                en: params.msg
            },
            data: {
                method: 'message'
            },
            include_player_ids: [params.onesignal_id]
        };

        Service.sendNotification(message)
            .then(data => {
                //logger.info("Push Sent");

                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'pushTest');

                return res.status(200).json(Service.response(1, localization.pushSuccess, data));
            })
            .catch(err => {
                //logger.info("Push Error", err);

                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'pushTest');

                return res.status(200).json(Service.response(0, localization.pushError, null));
            });
    },

    referralRecords: async function (req, res) {
        var startTime = new Date();

        //logger.info("Referral Records Request >> ", req.body);
        var referrals = [];
        User.find({
            is_deleted: false,
            'referral.referred_by': req.user._id
        })
            .then(data => {
                for (let i = 0; i < data.length; i++) {
                    referrals.push({
                        name: data[i].username,
                        numeric_id: data[i].numeric_id,
                        matches: data[i].referral.matches,
                        amount: data[i].referral.amount
                    });
                }

                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'referralRecords');

                //logger.info("REFERRALS", referrals);
                return res.status(200).json(Service.response(1, localization.referralSuccess, referrals));
            })
            .catch(e => {
                var endTime = new Date();
                utility.logElapsedTime(req, startTime, endTime, 'referralRecords');

                return res.status(200).json(Service.response(0, localization.serverError, null));
            });
    },

    //for caching functionality
    autoLogin: async function (req, res) {
        var startTime = new Date();

        //logger.info("Auto Login Request >> ", req.body);

        autologin_totalWin = await Table.find({
            players: {
                $elemMatch: {
                    id: req.user._id,
                    pl: {
                        $gt: 0
                    }
                }
            }
        }).countDocuments();

        autologin_totalMatch = await Table.find({
            'players.id': req.user._id
        });

        var userdata = _.pick(
            req.user,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet',
            'facebook_id'
        );
        userdata.token = req.body.token;
        userdata.referral_code = req.user.referral.referral_code;
        userdata.mobileno = req.user.mobile_no.number;
        userdata.total_match = autologin_totalMatch.length || 0;
        userdata.total_win = autologin_totalWin || 0;

        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'autoLogin');

        return res.status(200).json(Service.response(1, localization.autologinSuccess, userdata));
    },

    verifyEmail: async function (req, res) {
        //logger.info("Verify Email Request >> ", req.params);

        var params = _.pick(req.params, 'token');

        if (_.isEmpty(params)) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkInvalid
            });
        }

        if (_.isEmpty(params.token)) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkInvalid
            });
        }

        var user = await User.findOne({
            'email_token.value': params.token
        });

        if (!user) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkInvalid
            });
        }

        if (user.email_token.expired_at < new Date().getTime()) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.linkExpired
            });
        }

        user.email_token.value = '';
        user.email_token.expired_at = 0;
        user.email_verified = true;

        // THIS USER EMAIL & OTP BOTH VERIFIED
        // REFERAL BONUS NOT PASSED ALREADY
        // GET REFERRAL USER
        // ADD BONUS IN REFERRAL USER MAIN WALLET
        // MARK AS REFERAL BONUS PASSED

        logger.info('USER', user);

        if (user.email_verified === true && user.otp_verified === true) {
            logger.info('VERIFIED');
            if (!user.ref_bonus_passed) {
                logger.info('NOT PASSED YET');
                // find user >> req.ref_user
                // add bonus in that user

                // let ref_user = await User.findOne({
                //     'ref_user': req.ref_user
                // });

                if (Service.validateObjectId(user.referral.referred_by)) {
                    let ref_user = await User.findOne({
                        _id: user.referral.referred_by
                    });

                    logger.info('Ref_User', ref_user);

                    if (ref_user) {
                        // ref_user.main_wallet = main_wallet + 5;
                        let update_ = await User.findByIdAndUpdate(
                            ref_user._id,
                            {
                                $inc: {
                                    main_wallet: config.ref_bonus
                                }
                            },
                            {
                                new: true
                            }
                        );
                        logger.info('Referral User', update_.main_wallet);

                        await User.findByIdAndUpdate(user._id, {
                            $set: {
                                ref_bonus_passed: true,
                                'referral.amount': config.ref_bonus
                            }
                        });

                        var order_id = utility.objectId();
                        var newTxn = new Transaction({
                            user_id: ref_user._id,
                            txn_amount: config.ref_bonus,
                            txn_win_amount: 0,
                            txn_main_amount: config.ref_bonus,
                            order_id: order_id,
                            created_at: new Date().getTime(),
                            transaction_type: 'C',
                            resp_msg: 'Referral bonus for ' + user.numeric_id,
                            is_status: 'S',
                            txn_mode: 'REF'
                        });

                        await newTxn
                            .save()
                            .then(c => {
                                console.log('TXN SAVED', c);
                            })
                            .catch(err => {
                                console.log('ERROR', err);
                            });
                    }
                }
            }
        }

        var saveRez = await user.save();

        if (!saveRez) {
            return res.render('verify_email.ejs', {
                status: 0,
                title: localization.ServerError
            });
        } else {
            return res.render('verify_email.ejs', {
                status: 1,
                title: localization.emailVerificationSuccess,
                msg: localization.emailVerificationSuccessMsg
            });
        }
    },

    resendVerifyEmail: async function (req, res) {
        //logger.info("Resend Email Verification Link Request >> ", req.body);

        var params = _.pick(req.body, 'token', 'email');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.token) || _.isEmpty(params.email)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (!Service.validateEmail(params.email))
            return res.status(200).json(Service.response(0, localization.emailValidationError, null));

        var us = await User.findOne({
            email: params.email.trim(),
            _id: {
                $ne: req.user._id
            }
        });

        if (us) return res.status(200).json(Service.response(0, localization.emailExistError, null));

        var email_token = cryptr.encrypt(params.email);
        req.user.email = params.email;
        req.user.email_token.value = email_token;
        req.user.email_token.expired_at = new Date().getTime() + config.EMAIL_LINK_EXPIRED_IN_MINUTES * 60 * 1000;

        var newUserSave = await req.user.save();

        var userdata = _.pick(
            newUserSave,
            'name',
            'username',
            'email',
            'profilepic',
            'otp_verified',
            'numeric_id',
            'email_verified',
            'main_wallet',
            'win_wallet'
        );
        userdata.token = req.body.token;
        userdata.referral_code = newUserSave.referral.referral_code;
        userdata.mobileno = newUserSave.mobile_no.number;

        if (!newUserSave) return res.status(200).json(Service.response(0, localization.ServerError, null));

        var sendMailRes = await Mailer.sendWelcomeEmail(newUserSave);
        //logger.info("SEND MAIL RES", sendMailRes);
        if (sendMailRes) {
            //logger.info("Welcome Email Sent");
            return res.status(200).json(Service.response(1, localization.emailSentSuccess, null));
        } else {
            //logger.info("Welcome Email Error");
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }
    },

    passwordResetPageRender: async function (req, res) {
        //logger.info("Password Reset Page Render Request >> ", req.params);

        var params = _.pick(req.params, 'token');

        if (_.isEmpty(params)) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkInvalid,
                host: config.pre + req.headers.host
            });
        }

        if (_.isEmpty(params.token)) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkInvalid,
                host: config.pre + req.headers.host
            });
        }

        var user = await User.findOne({
            'reset_token.value': params.token
        });

        if (!user) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkInvalid,
                host: config.pre + req.headers.host
            });
        }

        if (user.reset_token.expired_at < new Date().getTime()) {
            return res.render('reset_password.ejs', {
                status: 0,
                title: localization.linkExpired,
                host: config.pre + req.headers.host
            });
        }
        return res.render('reset_password.ejs', {
            status: 1,
            token: params.token
        });
    },

    passwordResetByWebPage: async function (req, res) {
        //logger.info("Change Password Through Webpage Request >> ", req.body);

        var params = _.pick(req.body, 'pass_confirmation', 'pass', 'token');

        if (_.isEmpty(params)) {
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (_.isEmpty(params.pass_confirmation) || _.isEmpty(params.pass) || _.isEmpty(params.token)) {
            //logger.info("required parameter is missing");
            return res.status(200).json(Service.response(0, localization.missingParamError, null));
        }

        if (params.pass_confirmation != params.pass) {
            return res.status(200).json(Service.response(0, localization.passwordNotMatchError, null));
        }

        var usr = await User.findOne({
            'reset_token.value': params.token
        });

        if (usr.reset_token.expired_at < new Date().getTime()) {
            return res.status(200).json(Service.response(0, localization.linkExpired, null));
        }

        if (usr) {
            var hash = bcrypt.hashSync(params.pass_confirmation);
            usr.reset_token.value = '';
            usr.reset_token.expired_at = '0';
            usr.password = hash;
            var newUserSave = await usr.save();
            if (newUserSave) return res.status(200).json(Service.response(1, localization.webPassSuccess, null));
            else return res.status(200).json(Service.response(0, localization.ServerError, null));
        } else {
            return res.status(200).json(Service.response(0, localization.ServerError, null));
        }
    },

    updateStatus: async function (req, res) {
        var startTime = new Date();
        let  childBlockUserList=[]
        var params = _.pick(req.body, ['id', 'status']);
        //logger.info("PARAMS", params);
        console.log("===============")
        console.log(params.id)


        if (!params) return res.send(Service.response(0, localization.missingParamError, null));

        if (!Service.validateObjectId(params.id)) {
            return res.send(Service.response(0, localization.missingParamError, null));
        }

         childBlockUserList= await Service.DownLine(params.id)
         childBlockUserList.push(params.id)
        console.log(childBlockUserList);
        var rez = await User.updateMany({_id:{$in:childBlockUserList}}, {
            $set: {
                is_active: params.status == 'true'
            }
        });

        var endTime = new Date();
        utility.logElapsedTime(req, startTime, endTime, 'updateStatus');

        if (rez) {
            var newLog = new AccessLog({
                admin: req.admin._id,
                action: `${params.status == 'true' ? 'Activated' : 'Deacivated'} user's account`,
                user: params.id,
                created_at: new Date().getTime()
            });
            await newLog.save();

            return res.send(Service.response(1, localization.success, null));
        }
        else return res.send(Service.response(0, localization.serverError, null));
    },

    sendSMSTest: function (req, res) {
        //logger.info("SMS Test Request >> ", req.body);
        var otp = 123456;
        var projectname = config.project_name;
        var message = otp + ' is your OTP (One Time Password) to verify your user account on ' + projectname;
        return new Promise((resolve, reject) => {
            request.post(
                'https://api.textlocal.in/send/',
                {
                    form: {
                        apikey: config.textLocalKey.apikey,
                        numbers: req.body.mobile,
                        message: message,
                        sender: config.textLocalKey.sender
                    }
                },
                function (error, response, body) {
                    if (response.statusCode == 200) {
                        //logger.info('Response:', body);
                        var body_obj = JSON.parse(body);
                        if (body_obj.status == 'success') {
                            //logger.info("OTP Sent!");
                            return resolve(true);
                        } else {
                            return resolve(false);
                        }
                    } else {
                        //logger.info("Server Error", body);
                        return resolve(false);
                    }
                }
            );
        });
    },

    getAppVersion: async function (req, res) {
        var version = await Default.findOne({
            key: 'app_version'
            // whatsapp_no: '',
            // contact_email: ''
        });
        if (version) return res.send(Service.response(1, localization.success, version));
        else return res.send(Service.response(0, localization.ServerError, null));
    },

    getUserListAjax: async (req, res) => {
        var startTime = new Date();
        try {
            const params = req.query;

            //logger.info(params.search.value)

            let obj = {
                is_deleted: false
            };
            if (params.search) {
                if (params.search.value.trim() != '') {
                    obj['$or'] = [
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $toString: "$numeric_id" },
                                    regex: params.search.value,
                                    options: "i"
                                }
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

            var sortObj = {};
            if (params.order) {
                if (params.order[0]) {
                    if (params.order[0].column == '0') {
                        // SORT BY USERNAME
                        sortObj.numeric_id = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '2') {
                        // SORT BY REG DATE
                        sortObj.games_played = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '3') {
                        // SORT BY REG DATE
                        sortObj.main_wallet = params.order[0].dir == 'asc' ? 1 : -1;
                    } else if (params.order[0].column == '4') {
                        // SORT BY REG DATE
                        sortObj.win_wallet = params.order[0].dir == 'asc' ? 1 : -1;
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
            //logger.info('Object to Search :: ', obj);

            // let list = await User.find(obj)
            //     .sort(sortObj)
            //     .skip(parseInt(params.start))
            //     .limit(params.length == -1 ? '' : parseInt(params.length));
            let list = await User.aggregate([
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
                    // console.log(u);
                    //logger.info('Found User :: ', u);
                    let gamePlayedCount = await Table.find({
                        'players.id': u._id
                    }).countDocuments();
                    var kyc_status = u.kyc_verified ? u.kyc_verified.status : 'unverified';
                    kyc_status = kyc_status.charAt(0).toUpperCase() + kyc_status.slice(1).toLowerCase();
                    let created=await Service.formateDateandTime(u.created_at)
                    return [
                        u.numeric_id,
                        `${u.mobile_no?.country_code ?? ''} ${u?.mobile_no?.number??''}`,
                        u.email??'',
                        gamePlayedCount,
                        u.main_wallet,
                        u.win_wallet,
                        created,
                        `<small class="label bg-${u.email_verified && u.otp_verified ? 'green' : 'red'}">${u.email_verified && u.otp_verified ? 'Verified' : 'Unverified'
                        }</small>`,
                        `<a target="_blank" href="${config.pre + req.headers.host}/user/view/${u._id
                        }" class="on-editing save-row"><i class="fa fa-eye"></i></a>`
                    ];
                })
            );

            let total = await User.find({
                is_deleted: false
            }).countDocuments();
            let total_f = await User.find(obj).countDocuments();

            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'getUserListAjax');
            // console.log("list");
            return res.status(200).send({
                data: list,
                draw: new Date().getTime(),
                recordsTotal: total,
                recordsFiltered: total_f
            });
        } catch (err) {
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'getUserListAjax');

            return res.send(Service.response(0, localization.ServerError, err.message));
        }
    },

    findUser: async (req, res) => {
        var startTime = new Date();

        try {
            const params = _.pick(req.query, ['search']);
// logger.info('Params :: ', params);
            let aggregate_obj = [];
            let condition = {
                is_deleted: false
            };
            if (params.search) {
                if (params.search.trim() != '') {
                    condition['search_id'] = {
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
                        search_id: 1
                    }
                },
                {
                    $limit: 10
                },
                {
                    $project: {
                        id: '$_id',
                        text: '$search_id'
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            );

            let users = await User.aggregate(aggregate_obj).allowDiskUse(true);
// console.log(users);
            var endTime = new Date();
            // utility.logElapsedTime(req, startTime, endTime, 'findUser');

            return res.send({ results: users });
        } catch (err) {
            logger.info('ERR', err);
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'findUser');

            return res.send({ results: [] });
        }
    },
    findUserByRole: async (req, res) => {
        var startTime = new Date();
        try {
   if(req.admin.role==="Company"){
    const params = _.pick(req.query, ['search']);
    let aggregate_obj = [];
    let condition = {
        is_deleted: false,
        role:req.query.role
    };
    if (params.search) {
        if (params.search.trim() != '') {
            condition['search_id'] = {
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
                search_id: 1
            }
        },
        {
            $limit: 10
        },
        {
            $project: {
                id: '$_id',
                text: '$search_id'
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    );

    let users = await User.aggregate(aggregate_obj).allowDiskUse(true);
    var endTime = new Date();

    return res.send({ results: users });
   }else{
    const params = _.pick(req.query, ['search']);
    let aggregate_obj = [];
    let condition = {
        is_deleted: false,
        role:req.query.role,
        // parent:req.admin._id
    };
    if (params.search) {
        if (params.search.trim() != '') {
            condition['search_id'] = {
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
                search_id: 1
            }
        },
        {
            $limit: 10
        },
        {
            $project: {
                id: '$_id',
                text: '$search_id'
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    );

    let users = await User.aggregate(aggregate_obj).allowDiskUse(true);
    var endTime = new Date();

    return res.send({ results: users });
   }

       
           
        } catch (err) {
            logger.info('ERR', err);
            var endTime = new Date();
            utility.logElapsedTime(req, startTime, endTime, 'findUser');

            return res.send({ results: [] });
        }
    }
};
